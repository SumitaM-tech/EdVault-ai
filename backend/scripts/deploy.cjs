const hre = require('hardhat');
const { writeFileSync, mkdirSync } = require('fs');
const { join } = require('path');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  const CredentialRegistry = await hre.ethers.getContractFactory('CredentialRegistry');
  const contract = await CredentialRegistry.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('CredentialRegistry deployed to:', address);
  const net = await hre.ethers.provider.getNetwork();
  const name = hre.network.name;
  console.log(`Address saved to deployments/${name}.json`);
  if (name === 'sepolia') {
    console.log(`Explorer: https://sepolia.etherscan.io/address/${address}`);
    console.log('Set in backend\\.env -> CONTRACT_ADDRESS=' + address + ', CHAIN_ID=11155111, RPC_URL=<your Sepolia RPC>');
  }

  const dir = join(process.cwd(), 'deployments');
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, `${name}.json`),
    JSON.stringify({
      CredentialRegistry: address,
      chainId: Number(net.chainId),
      deployedAt: new Date().toISOString()
    }, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
