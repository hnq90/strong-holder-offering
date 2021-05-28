const { expect } = require('chai');
const { describe } = require('mocha');
const { expectRevert, time } = require('@openzeppelin/test-helpers');

describe('Airdrop', async () => {
  let mochiNFT, airdrop, moma;
  let deployer, alice, bob, jack, peter, lisa;
  let name = 'Mochi NFT';
  let symbol = 'Mochi NFT';
  let tokenId = ['0', '1', '2', '3', '4'];
  let amountMomaPerNFT = '1000000000000000000';
  let startBlock;

  let amountToAirdrop = '1000000000000000000000000';

  beforeEach(async () => {
    [deployer, alice, bob, jack, peter, lisa] = await ethers.getSigners();

    let SampleERC1155 = await ethers.getContractFactory('SampleERC1155');

    mochiNFT = await SampleERC1155.connect(deployer).deploy(name, symbol);

    let MOMA = await ethers.getContractFactory('MockMOMA');

    moma = await MOMA.connect(deployer).deploy();

    startBlock = await time.latestBlock();

    let Airdrop = await ethers.getContractFactory('Airdrop');

    airdrop = await Airdrop.connect(deployer).deploy(
      mochiNFT.address,
      moma.address,
      tokenId,
      amountMomaPerNFT,
      startBlock + 1000
    );
  });

  it('Deploy successfully', async () => {
    expect(await airdrop.moma()).to.be.equal(moma.address);
    expect(await airdrop.erc1155()).to.be.equal(mochiNFT.address);
    expect(parseInt(await airdrop.amountMomaPerNFT())).to.be.equal(parseInt(amountMomaPerNFT));
    expect(parseInt(await airdrop.endBlock())).to.be.equal(parseInt(startBlock + 1000));
  });

  it('Only owner can call forceEnd and withdrawFunds', async () => {
    await expectRevert(airdrop.connect(alice).forceEnd(), 'Ownable: caller is not the owner');
    await expectRevert(
      airdrop.connect(alice).withdrawFunds(moma.address),
      'Ownable: caller is not the owner'
    );
  });

  describe('Check claim', async () => {
    let tokenUri = ['newUri0', 'newUri1', 'newUri2', 'newUri3', 'newUri4'];
    beforeEach(async () => {
      await mochiNFT.connect(deployer).issueNewTokens(tokenUri);

      for (let i = 0; i < tokenId.length; i++) {
        await mochiNFT
          .connect(deployer)
          .mintByAddressBatch(
            tokenId[i],
            [alice.address, bob.address, jack.address, peter.address, lisa.address],
            ['1', '1', '1', '1', '1'],
            ['0x', '0x', '0x', '0x', '0x']
          );
      }
      await moma.connect(deployer).mint(airdrop.address, amountToAirdrop);

      await mochiNFT.connect(deployer).pause();
    });

    it('Cannot claim when nft not pause', async () => {
      await mochiNFT.connect(deployer).unpause();

      await expectRevert(airdrop.connect(alice).claim(tokenId[0]), 'NFT not paused');
      await expectRevert(airdrop.connect(alice).claim(tokenId[1]), 'NFT not paused');
      await expectRevert(airdrop.connect(alice).claim(tokenId[2]), 'NFT not paused');
      await expectRevert(airdrop.connect(alice).claim(tokenId[3]), 'NFT not paused');
      await expectRevert(airdrop.connect(alice).claim(tokenId[4]), 'NFT not paused');
    });

    it('Cannot claim when campaign was ended', async () => {
      await airdrop.connect(deployer).forceEnd();
      await expectRevert(airdrop.connect(alice).claim(tokenId[0]), 'Claim was ended');
    });

    it('Cannot claim cause invalid tokenId', async () => {
      await expectRevert(airdrop.connect(alice).claim('100'), 'Invalid tokenId');
    });

    it('Cannot claim cause user dose not own nft', async () => {
      await mochiNFT.connect(deployer).unpause();
      await mochiNFT.connect(alice).burn(tokenId[0], '1');
      await mochiNFT.connect(alice).burn(tokenId[1], '1');
      await mochiNFT.connect(alice).burn(tokenId[2], '1');
      await mochiNFT.connect(alice).burn(tokenId[3], '1');
      await mochiNFT.connect(alice).burn(tokenId[4], '1');
      await mochiNFT.connect(deployer).pause();

      await expectRevert(airdrop.connect(alice).claim(tokenId[0]), 'You do not own NFT');
      await expectRevert(airdrop.connect(alice).claim(tokenId[1]), 'You do not own NFT');
      await expectRevert(airdrop.connect(alice).claim(tokenId[2]), 'You do not own NFT');
      await expectRevert(airdrop.connect(alice).claim(tokenId[3]), 'You do not own NFT');
      await expectRevert(airdrop.connect(alice).claim(tokenId[4]), 'You do not own NFT');
    });

    it('Not enough balance to claim', async () => {
      await airdrop.connect(deployer).withdrawFunds(moma.address);

      await expectRevert(airdrop.connect(alice).claim(tokenId[0]), 'Not enough balance to claim');
    });

    it('Claim successfully', async () => {
      await airdrop.connect(alice).claim(tokenId[0]);

      expect(parseInt(await moma.balanceOf(alice.address))).to.be.equal(parseInt(amountMomaPerNFT));

      expect(await airdrop.claimed(alice.address, tokenId[0])).to.be.equal(true);
    });

    it('Cannot claim same tokenId twice', async () => {
      await airdrop.connect(alice).claim(tokenId[0]);

      await expectRevert(airdrop.connect(alice).claim(tokenId[0]), 'You claimed this tokenId');
    });
  });
});
