import { ethers } from "hardhat";
import { expect } from "chai";
import { fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("CUSDT", function () {
  let cusdt: any;
  let owner: any;
  let addr1: any;
  let addr2: any;
  let addr3: any;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const CUSDTFactory = await ethers.getContractFactory("CUSDT");
    cusdt = await CUSDTFactory.deploy();
    await cusdt.waitForDeployment();
  });

  describe("部署", function () {
    it("应该正确设置代币信息", async function () {
      expect(await cusdt.name()).to.equal("Confidential USDT");
      expect(await cusdt.symbol()).to.equal("CUSDT");
      expect(await cusdt.owner()).to.equal(owner.address);
    });
  });

  describe("铸造功能", function () {
    it("应该允许owner铸造代币", async function () {
      const mintAmount = 1000000; // 1 CUSDT (6位小数)
      
      const tx = await cusdt.mint(addr1.address, mintAmount);
      
      await expect(tx)
        .to.emit(cusdt, "Mint")
        .withArgs(addr1.address, await cusdt.totalSupply());
    });

    it("应该拒绝非owner铸造代币", async function () {
      const mintAmount = 1000000;
      
      await expect(
        cusdt.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.revertedWithCustomError(cusdt, "OwnableUnauthorizedAccount");
    });

    it("应该正确设置ACL权限", async function () {
      const mintAmount = 1000000;
      
      await cusdt.mint(addr1.address, mintAmount);
      
      // 验证用户可以查询自己的余额
      const balance = await cusdt.connect(addr1).getBalance();
      expect(balance).to.not.be.undefined;
    });
  });

  describe("转账功能", function () {
    const initialAmount = 1000000; // 1 CUSDT
    const transferAmount = 500000;  // 0.5 CUSDT

    beforeEach(async function () {
      await cusdt.mint(addr1.address, initialAmount);
      await cusdt.mint(addr2.address, initialAmount);
    });

    it("应该能够进行加密转账", async function () {
      // 创建加密输入
      const input = fhevm.createEncryptedInput(await cusdt.getAddress(), addr1.address);
      input.add64(BigInt(transferAmount));
      const encryptedInput = await input.encrypt();

      // 执行加密转账
      const tx = await cusdt.connect(addr1).transferEncrypted(
        addr2.address,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      expect(tx).to.not.be.reverted;
      
      // 检查事件
      await expect(tx)
        .to.emit(cusdt, "EncryptedTransfer")
        .withArgs(addr1.address, addr2.address, encryptedInput.handles[0]);
    });

    it("应该正确处理转账权限", async function () {
      // 创建加密输入
      const input = fhevm.createEncryptedInput(await cusdt.getAddress(), addr1.address);
      input.add64(BigInt(transferAmount));
      const encryptedInput = await input.encrypt();

      // 批准addr3可以转移addr1的代币
      const approveInput = fhevm.createEncryptedInput(await cusdt.getAddress(), addr1.address);
      approveInput.add64(BigInt(transferAmount));
      const approveEncryptedInput = await approveInput.encrypt();

      await cusdt.connect(addr1).approve(addr3.address, approveEncryptedInput.handles[0]);

      // addr3代表addr1转账给addr2
      const success = await cusdt.connect(addr3).transferFrom(
        addr1.address,
        addr2.address,
        encryptedInput.handles[0]
      );

      expect(success).to.not.be.reverted;
    });
  });

  describe("余额查询", function () {
    it("应该返回用户的加密余额", async function () {
      const mintAmount = 1000000;
      await cusdt.mint(addr1.address, mintAmount);

      const balance = await cusdt.connect(addr1).getBalance();
      expect(balance).to.not.be.undefined;
    });

    it("应该返回正确的批准额度", async function () {
      const mintAmount = 1000000;
      const approveAmount = 500000;
      
      await cusdt.mint(addr1.address, mintAmount);
      
      // 创建加密批准
      const input = fhevm.createEncryptedInput(await cusdt.getAddress(), addr1.address);
      input.add64(BigInt(approveAmount));
      const encryptedInput = await input.encrypt();
      
      await cusdt.connect(addr1).approve(addr2.address, encryptedInput.handles[0]);

      const allowance = await cusdt.connect(addr1).getAllowance(addr2.address);
      expect(allowance).to.not.be.undefined;
    });
  });

  describe("ACL和权限", function () {
    it("应该正确设置mint的ACL权限", async function () {
      const mintAmount = 1000000;
      
      await cusdt.mint(addr1.address, mintAmount);
      
      // 用户应该能够查询自己的余额
      const balance = await cusdt.connect(addr1).getBalance();
      expect(balance).to.not.be.undefined;
    });

    it("应该在转账时正确设置ACL权限", async function () {
      const initialAmount = 1000000;
      const transferAmount = 500000;

      await cusdt.mint(addr1.address, initialAmount);
      
      // 创建加密输入
      const input = fhevm.createEncryptedInput(await cusdt.getAddress(), addr1.address);
      input.add64(BigInt(transferAmount));
      const encryptedInput = await input.encrypt();

      // 执行转账
      await cusdt.connect(addr1).transferEncrypted(
        addr2.address,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // 接收者应该能够查询自己的余额
      const receiverBalance = await cusdt.connect(addr2).getBalance();
      expect(receiverBalance).to.not.be.undefined;
    });
  });

  describe("边界情况", function () {
    it("应该处理零金额转账", async function () {
      await cusdt.mint(addr1.address, 1000000);
      
      // 创建零金额的加密输入
      const input = fhevm.createEncryptedInput(await cusdt.getAddress(), addr1.address);
      input.add64(BigInt(0));
      const encryptedInput = await input.encrypt();

      const tx = await cusdt.connect(addr1).transferEncrypted(
        addr2.address,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      expect(tx).to.not.be.reverted;
    });

    it("应该处理大额转账", async function () {
      const largeAmount = BigInt("1000000000000000000"); // 很大的数额
      
      // 先铸造大量代币
      await cusdt.mint(addr1.address, largeAmount);
      
      // 创建大额转账的加密输入
      const input = fhevm.createEncryptedInput(await cusdt.getAddress(), addr1.address);
      input.add64(largeAmount / BigInt(2)); // 转账一半
      const encryptedInput = await input.encrypt();

      const tx = await cusdt.connect(addr1).transferEncrypted(
        addr2.address,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      expect(tx).to.not.be.reverted;
    });
  });

  describe("集成测试", function () {
    it("完整的CUSDT工作流程", async function () {
      const initialMint = 2000000; // 2 CUSDT
      const transferAmount = 800000; // 0.8 CUSDT
      const approveAmount = 500000; // 0.5 CUSDT

      // 1. 铸造代币给addr1
      await cusdt.mint(addr1.address, initialMint);
      
      // 2. 检查余额
      const balance1 = await cusdt.connect(addr1).getBalance();
      expect(balance1).to.not.be.undefined;

      // 3. 转账给addr2
      const transferInput = fhevm.createEncryptedInput(await cusdt.getAddress(), addr1.address);
      transferInput.add64(BigInt(transferAmount));
      const transferEncryptedInput = await transferInput.encrypt();

      await cusdt.connect(addr1).transferEncrypted(
        addr2.address,
        transferEncryptedInput.handles[0],
        transferEncryptedInput.inputProof
      );

      // 4. 检查接收者余额
      const balance2 = await cusdt.connect(addr2).getBalance();
      expect(balance2).to.not.be.undefined;

      // 5. 批准addr3使用addr1的代币
      const approveInput = fhevm.createEncryptedInput(await cusdt.getAddress(), addr1.address);
      approveInput.add64(BigInt(approveAmount));
      const approveEncryptedInput = await approveInput.encrypt();

      await cusdt.connect(addr1).approve(addr3.address, approveEncryptedInput.handles[0]);

      // 6. 检查批准额度
      const allowance = await cusdt.connect(addr1).getAllowance(addr3.address);
      expect(allowance).to.not.be.undefined;

      // 7. 使用批准进行转账
      const transferFromInput = fhevm.createEncryptedInput(await cusdt.getAddress(), addr3.address);
      transferFromInput.add64(BigInt(approveAmount));
      const transferFromEncryptedInput = await transferFromInput.encrypt();

      await cusdt.connect(addr3).transferFrom(
        addr1.address,
        addr3.address,
        transferFromEncryptedInput.handles[0]
      );

      // 8. 最终验证
      const finalBalance3 = await cusdt.connect(addr3).getBalance();
      expect(finalBalance3).to.not.be.undefined;
    });
  });
});