import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // 部署SendTip合约（现在包含了CUSDT功能）
  const deployedSendTip = await deploy("SendTip", {
    from: deployer,
    log: true,
  });

  console.log(`SendTip contract deployed at: `, deployedSendTip.address);

  // 可选：部署CUSDT合约（用于测试）
  const deployedCUSDT = await deploy("CUSDT", {
    from: deployer,
    log: true,
  });

  console.log(`CUSDT contract deployed at: `, deployedCUSDT.address);

  // 部署FHECounter（保持原有功能）
  // const deployedFHECounter = await deploy("FHECounter", {
  //   from: deployer,
  //   log: true,
  // });

  // console.log(`FHECounter contract deployed at: `, deployedFHECounter.address);

  // 输出部署摘要
  console.log("\n=== Deployment Summary ===");
  console.log(`SendTip (with CUSDT): ${deployedSendTip.address}`);
  console.log(`CUSDT: ${deployedCUSDT.address}`);
  // console.log(`FHECounter: ${deployedFHECounter.address}`);
  console.log("=========================\n");
};

export default func;
func.id = "deploy_sendtip"; // id required to prevent reexecution
func.tags = ["SendTip", "CUSDT", "FHECounter"];
