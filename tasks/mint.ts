import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("task:mint", "Mint CUSDT to an address")
  .addParam("to", "recipient address")
  .addParam("amount", "amount in micro (6 decimals)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const { to, amount } = taskArguments as { to: string; amount: string };
    const cusdt = await deployments.get("CUSDT");
    const c = await ethers.getContractAt("CUSDT", cusdt.address);
    const tx = await c.mint(to, amount);
    console.log(`Mint tx: ${tx.hash}`);
    await tx.wait();
  });

