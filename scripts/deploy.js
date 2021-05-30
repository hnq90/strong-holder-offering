const { ethers, network } = require('hardhat');
const fs = require('fs');

async function main() {
  let momaAddress, mochiNftAddress;
  let amountMomaPerNFT = '1000000000000000000000'; // 1000 MOMA
  let tokenIds = ['0', '1', '2', '3', '4'];
  let endBlock = '10000000';

  let [deployer] = await ethers.getSigners();

  if (network.name === 'bscmainnet') {
    momaAddress = '0xb72842d6f5fedf91d22d56202802bb9a79c6322e';
    mochiNftAddress = '0xf0B31201F7F21bACD87Edc7148D2cA851210aD92';
  } else {
    throw Error('Invalid network');
  }

  console.log('\nDeploy Airdrop...');
  let Airdrop = await ethers.getContractFactory('Airdrop');
  let airdrop = await Airdrop.connect(deployer).deploy(
    mochiNftAddress,
    momaAddress,
    tokenIds,
    amountMomaPerNFT,
    endBlock
  );
  await airdrop.deployed();

  let result = {
    mochiNft: mochiNftAddress,
    airdrop: airdrop.address,
  };

  console.log(result);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
