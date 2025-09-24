import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("mint", "Mint CUSDT tokens to a user")
  .addParam("contract", "The CUSDT contract address")
  .addParam("to", "The address to mint tokens to")
  .addParam("amount", "The amount of tokens to mint (in whole numbers, e.g. 1000)")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress, to, amount } = taskArguments;
    
    const [signer] = await ethers.getSigners();
    
    // 获取CUSDT合约实例
    const CUSDT = await ethers.getContractFactory("CUSDT");
    const cusdt = CUSDT.attach(contractAddress).connect(signer);
    
    console.log(`Minting ${amount} CUSDT to ${to}...`);
    
    // 调用mint函数
    const tx = await cusdt.mint(to, amount);
    
    console.log(`Transaction hash: ${tx.hash}`);
    
    // 等待交易确认
    const receipt = await tx.wait();
    
    console.log(`✅ Successfully minted ${amount} CUSDT to ${to}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
    console.log(`Block number: ${receipt.blockNumber}`);
  });