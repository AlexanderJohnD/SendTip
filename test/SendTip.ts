import { ethers } from "hardhat";
import { expect } from "chai";
import { fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("SendTip", function () {
  let sendTip: any;
  let cusdt: any;
  let owner: any;
  let addr1: any;
  let addr2: any;
  let addr3: any;
  
  // GitHub用户名常量
  const GITHUB_USER1 = "alice";
  const GITHUB_USER2 = "bob";
  const GITHUB_USER3 = "charlie";
  
  // 初始化金额
  const INITIAL_MINT_AMOUNT = 1000000; // 1 CUSDT with 6 decimals

  beforeEach(async function () {
    // 获取签名者
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // 部署CUSDT合约
    const CUSDTFactory = await ethers.getContractFactory("CUSDT");
    cusdt = await CUSDTFactory.deploy();
    await cusdt.waitForDeployment();

    // 部署SendTip合约
    const SendTipFactory = await ethers.getContractFactory("SendTip");
    sendTip = await SendTipFactory.deploy(await cusdt.getAddress());
    await sendTip.waitForDeployment();

    // 给addr1和addr2铸造一些CUSDT代币
    await cusdt.mint(addr1.address, INITIAL_MINT_AMOUNT);
    await cusdt.mint(addr2.address, INITIAL_MINT_AMOUNT);
    
    // 批准SendTip合约可以转移用户的CUSDT代币
    await cusdt.connect(addr1).approve(await sendTip.getAddress(), INITIAL_MINT_AMOUNT);
    await cusdt.connect(addr2).approve(await sendTip.getAddress(), INITIAL_MINT_AMOUNT);
  });

  describe("GitHub用户注册", function () {
    it("应该能够注册GitHub用户名", async function () {
      await sendTip.connect(addr1).registerGithubUser(GITHUB_USER1);
      
      const githubUsername = await sendTip.getGithubUsername(addr1.address);
      const walletAddress = await sendTip.getWalletAddress(GITHUB_USER1);
      
      expect(githubUsername).to.equal(GITHUB_USER1);
      expect(walletAddress).to.equal(addr1.address);
      expect(await sendTip.isRegistered(addr1.address)).to.be.true;
      expect(await sendTip.githubUsernameExists(GITHUB_USER1)).to.be.true;
    });

    it("应该防止重复注册", async function () {
      await sendTip.connect(addr1).registerGithubUser(GITHUB_USER1);
      
      await expect(
        sendTip.connect(addr1).registerGithubUser("newusername")
      ).to.be.revertedWithCustomError(sendTip, "AlreadyRegistered");
    });

    it("应该防止注册已存在的GitHub用户名", async function () {
      await sendTip.connect(addr1).registerGithubUser(GITHUB_USER1);
      
      await expect(
        sendTip.connect(addr2).registerGithubUser(GITHUB_USER1)
      ).to.be.revertedWithCustomError(sendTip, "GitHubUsernameTaken");
    });

    it("应该拒绝空的GitHub用户名", async function () {
      await expect(
        sendTip.connect(addr1).registerGithubUser("")
      ).to.be.revertedWith("GitHub username cannot be empty");
    });

    it("应该拒绝过长的GitHub用户名", async function () {
      const longUsername = "a".repeat(40); // GitHub用户名最大39个字符
      
      await expect(
        sendTip.connect(addr1).registerGithubUser(longUsername)
      ).to.be.revertedWith("GitHub username too long");
    });
  });

  describe("Tip发送功能", function () {
    beforeEach(async function () {
      // 注册两个用户
      await sendTip.connect(addr1).registerGithubUser(GITHUB_USER1);
      await sendTip.connect(addr2).registerGithubUser(GITHUB_USER2);
    });

    it("应该能够发送加密tip", async function () {
      const tipAmount = 100000; // 0.1 CUSDT

      // 创建加密输入
      const input = fhevm.createEncryptedInput(await sendTip.getAddress(), addr1.address);
      input.add64(BigInt(tipAmount));
      const encryptedInput = await input.encrypt();

      // 发送tip
      const tx = await sendTip.connect(addr1).sendTip(
        GITHUB_USER2,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // 检查事件是否正确发出
      await expect(tx)
        .to.emit(sendTip, "TipSent")
        .withArgs(addr1.address, addr2.address, GITHUB_USER2, encryptedInput.handles[0]);
    });

    it("应该拒绝未注册用户发送tip", async function () {
      const tipAmount = 100000;

      // 创建加密输入
      const input = fhevm.createEncryptedInput(await sendTip.getAddress(), addr3.address);
      input.add64(BigInt(tipAmount));
      const encryptedInput = await input.encrypt();

      await expect(
        sendTip.connect(addr3).sendTip(
          GITHUB_USER2,
          encryptedInput.handles[0],
          encryptedInput.inputProof
        )
      ).to.be.revertedWithCustomError(sendTip, "NotRegistered");
    });

    it("应该拒绝向不存在的GitHub用户发送tip", async function () {
      const tipAmount = 100000;

      // 创建加密输入
      const input = fhevm.createEncryptedInput(await sendTip.getAddress(), addr1.address);
      input.add64(BigInt(tipAmount));
      const encryptedInput = await input.encrypt();

      await expect(
        sendTip.connect(addr1).sendTip(
          "nonexistentuser",
          encryptedInput.handles[0],
          encryptedInput.inputProof
        )
      ).to.be.revertedWithCustomError(sendTip, "UserNotFound");
    });

    it("应该正确更新tip统计", async function () {
      const tipAmount = 100000; // 0.1 CUSDT

      // 创建加密输入
      const input = fhevm.createEncryptedInput(await sendTip.getAddress(), addr1.address);
      input.add64(BigInt(tipAmount));
      const encryptedInput = await input.encrypt();

      // 发送tip
      await sendTip.connect(addr1).sendTip(
        GITHUB_USER2,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // 检查发送者的统计
      const totalSent = await sendTip.connect(addr1).getTotalTipsSent();
      expect(totalSent).to.not.be.undefined;

      // 检查接收者的统计
      const totalReceived = await sendTip.connect(addr2).getTotalTipsReceived();
      expect(totalReceived).to.not.be.undefined;
    });
  });

  describe("批量发送tip", function () {
    beforeEach(async function () {
      // 注册三个用户
      await sendTip.connect(addr1).registerGithubUser(GITHUB_USER1);
      await sendTip.connect(addr2).registerGithubUser(GITHUB_USER2);
      await sendTip.connect(addr3).registerGithubUser(GITHUB_USER3);
      
      // 给addr1更多余额用于批量发送
      await cusdt.mint(addr1.address, INITIAL_MINT_AMOUNT);
      await cusdt.connect(addr1).approve(await sendTip.getAddress(), INITIAL_MINT_AMOUNT * 2);
    });

    it("应该能够批量发送tip", async function () {
      const tipAmount = 50000; // 0.05 CUSDT each
      
      // 准备批量发送数据
      const toUsers = [GITHUB_USER2, GITHUB_USER3];
      const encryptedAmounts: any[] = [];
      const inputProofs: any[] = [];

      for (let i = 0; i < toUsers.length; i++) {
        const input = fhevm.createEncryptedInput(await sendTip.getAddress(), addr1.address);
        input.add64(BigInt(tipAmount));
        const encryptedInput = await input.encrypt();
        
        encryptedAmounts.push(encryptedInput.handles[0]);
        inputProofs.push(encryptedInput.inputProof);
      }

      // 执行批量发送
      const tx = await sendTip.connect(addr1).batchSendTips(
        toUsers,
        encryptedAmounts,
        inputProofs
      );

      // 检查事件
      await expect(tx)
        .to.emit(sendTip, "TipSent")
        .withArgs(addr1.address, addr2.address, GITHUB_USER2, encryptedAmounts[0]);

      await expect(tx)
        .to.emit(sendTip, "TipSent")
        .withArgs(addr1.address, addr3.address, GITHUB_USER3, encryptedAmounts[1]);
    });

    it("应该拒绝数组长度不匹配", async function () {
      const toUsers = [GITHUB_USER2, GITHUB_USER3];
      const encryptedAmounts = ["0x1234567890123456789012345678901234567890123456789012345678901234"];
      const inputProofs = ["0x"];

      await expect(
        sendTip.connect(addr1).batchSendTips(toUsers, encryptedAmounts, inputProofs)
      ).to.be.revertedWith("Array lengths mismatch");
    });

    it("应该限制批量发送的数量", async function () {
      const tooManyUsers = Array(11).fill(GITHUB_USER2); // 超过10个
      const encryptedAmounts = Array(11).fill("0x1234567890123456789012345678901234567890123456789012345678901234");
      const inputProofs = Array(11).fill("0x");

      await expect(
        sendTip.connect(addr1).batchSendTips(tooManyUsers, encryptedAmounts, inputProofs)
      ).to.be.revertedWith("Too many tips at once");
    });
  });

  describe("查询功能", function () {
    beforeEach(async function () {
      await sendTip.connect(addr1).registerGithubUser(GITHUB_USER1);
      await sendTip.connect(addr2).registerGithubUser(GITHUB_USER2);
    });

    it("应该返回正确的GitHub用户名", async function () {
      const githubUsername = await sendTip.getGithubUsername(addr1.address);
      expect(githubUsername).to.equal(GITHUB_USER1);
    });

    it("应该返回正确的钱包地址", async function () {
      const walletAddress = await sendTip.getWalletAddress(GITHUB_USER1);
      expect(walletAddress).to.equal(addr1.address);
    });

    it("应该正确检查GitHub用户名是否已被使用", async function () {
      expect(await sendTip.isGithubUsernameTaken(GITHUB_USER1)).to.be.true;
      expect(await sendTip.isGithubUsernameTaken("nonexistentuser")).to.be.false;
    });

    it("应该返回用户余额", async function () {
      const balance = await sendTip.connect(addr1).getBalance();
      expect(balance).to.not.be.undefined;
    });

    it("应该拒绝未注册用户查询tip统计", async function () {
      await expect(
        sendTip.connect(addr3).getTotalTipsReceived()
      ).to.be.revertedWith("Not registered");

      await expect(
        sendTip.connect(addr3).getTotalTipsSent()
      ).to.be.revertedWith("Not registered");
    });
  });

  describe("集成测试", function () {
    it("完整的工作流程测试", async function () {
      // 1. 注册两个用户
      await sendTip.connect(addr1).registerGithubUser(GITHUB_USER1);
      await sendTip.connect(addr2).registerGithubUser(GITHUB_USER2);

      // 2. 检查初始状态
      expect(await sendTip.isRegistered(addr1.address)).to.be.true;
      expect(await sendTip.isRegistered(addr2.address)).to.be.true;

      // 3. 发送tip
      const tipAmount = 200000; // 0.2 CUSDT
      const input = fhevm.createEncryptedInput(await sendTip.getAddress(), addr1.address);
      input.add64(BigInt(tipAmount));
      const encryptedInput = await input.encrypt();

      const tx = await sendTip.connect(addr1).sendTip(
        GITHUB_USER2,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // 4. 验证事件
      await expect(tx)
        .to.emit(sendTip, "TipSent")
        .withArgs(addr1.address, addr2.address, GITHUB_USER2, encryptedInput.handles[0]);

      // 5. 验证状态更新
      const senderStats = await sendTip.connect(addr1).getTotalTipsSent();
      const receiverStats = await sendTip.connect(addr2).getTotalTipsReceived();
      
      expect(senderStats).to.not.be.undefined;
      expect(receiverStats).to.not.be.undefined;
    });
  });
});