/* eslint-disable */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...opts });
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
}

function updateAddresses(sendTip, cusdt) {
  const cfgPath = path.join(__dirname, '..', 'ui', 'src', 'config', 'contracts.ts');
  let content = fs.readFileSync(cfgPath, 'utf8');
  content = content.replace(/export const SENDTIP_ADDRESS = '[^']*';/, `export const SENDTIP_ADDRESS = '${sendTip}';`);
  content = content.replace(/export const CUSDT_ADDRESS = '[^']*';/, `export const CUSDT_ADDRESS = '${cusdt}';`);
  fs.writeFileSync(cfgPath, content);
  console.log('Updated ui/src/config/contracts.ts addresses');
}

function copyAbi(name) {
  const src = path.join(__dirname, '..', 'deployments', 'sepolia', `${name}.json`);
  const dstDir = path.join(__dirname, '..', 'ui', 'src', 'abi');
  if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });
  const artifact = readJson(src);
  const abiOnly = artifact.abi;
  const dst = path.join(dstDir, `${name}.json`);
  writeJson(dst, abiOnly);
  console.log(`Copied ABI for ${name} to ${dst}`);
}

function main() {
  // Deploy
  run('npx hardhat compile');
  run('npx hardhat deploy --network sepolia');

  // Read deployments
  const sendTipDeployment = readJson(path.join(__dirname, '..', 'deployments', 'sepolia', 'SendTip.json'));
  const cusdtDeployment = readJson(path.join(__dirname, '..', 'deployments', 'sepolia', 'CUSDT.json'));

  // Copy ABIs to frontend
  copyAbi('SendTip');
  copyAbi('CUSDT');

  // Update addresses in frontend config
  updateAddresses(sendTipDeployment.address, cusdtDeployment.address);

  console.log('\nDeployment complete. ABIs and addresses synced to UI.');
}

main();
