const { ethers, network } = require('hardhat');

async function main() {
  let momaAddress, mochiNftAddress;
  let amountMomaPerNFT = '2000000000000000000000'; // 1000 MOMA
  let tokenIds = ['0', '1', '2', '3', '4'];
  let endBlock = '10000000';

  let [deployer] = await ethers.getSigners();
  console.log('Deployer address: ', deployer.address);

  if (network.name === 'bscmainnet') {
    momaAddress = '0xb72842d6f5fedf91d22d56202802bb9a79c6322e';
    mochiNftAddress = '0xf0B31201F7F21bACD87Edc7148D2cA851210aD92';
  } else if (network.name === 'bsctestnet') {
    momaAddress = '0x777d20e16C6Bc508d5989e81a6c9B5034a32C6DD';

    let SampleERC1155 = await ethers.getContractFactory('SampleERC1155');
    let mochiNft = await SampleERC1155.connect(deployer).deploy(
      'Mochi Super Heroes Collections',
      'MOCHIHEROES'
    );
    await mochiNft.deployed();
    mochiNftAddress = mochiNft.address;
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
