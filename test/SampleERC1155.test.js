const { expect } = require('chai');
const { describe } = require('mocha');
const { expectRevert } = require('@openzeppelin/test-helpers');

describe('SampleERC1155', async () => {
  let mochiNFT;
  let deployer, alice, bob;
  let name = 'Mochi NFT';
  let symbol = 'Mochi NFT';

  beforeEach(async () => {
    [deployer, alice, bob] = await ethers.getSigners();

    let SampleERC1155 = await ethers.getContractFactory('SampleERC1155');

    mochiNFT = await SampleERC1155.connect(deployer).deploy(name, symbol);
  });

  it('Deploy successfully', async () => {
    expect(await mochiNFT.name()).to.be.equal(name);
    expect(await mochiNFT.symbol()).to.be.equal(symbol);
    expect(await mochiNFT.owner()).to.be.equal(deployer.address);
    expect(parseInt(await mochiNFT.currentTokenId())).to.be.equal(0);
    expect(await mochiNFT.paused()).to.be.equal(false);
  });

  it('Only owner can issueNewToken, mint, setUri', async () => {
    await expectRevert(
      mochiNFT.connect(alice).issueNewTokens(['newUri']),
      'Ownable: caller is not the owner'
    );

    await expectRevert(
      mochiNFT
        .connect(alice)
        .issueNewTokenAndMint('newUri', [alice.address, bob.address], ['1', '1'], ['0x', '0x']),
      'Ownable: caller is not the owner'
    );

    await expectRevert(
      mochiNFT.connect(alice).mint(alice.address, '0', '1', '0x'),
      'Ownable: caller is not the owner'
    );

    await expectRevert(
      mochiNFT.connect(alice).mintByBatch(alice.address, ['0'], ['1'], '0x'),
      'Ownable: caller is not the owner'
    );

    await expectRevert(
      mochiNFT
        .connect(alice)
        .mintByAddressBatch('0', [alice.address, bob.address], ['1', '1'], ['0x', '0x']),
      'Ownable: caller is not the owner'
    );

    await expectRevert(
      mochiNFT.connect(alice).setUri('0', 'newUri'),
      'Ownable: caller is not the owner'
    );

    await expectRevert(mochiNFT.connect(alice).pause(), 'Ownable: caller is not the owner');

    await expectRevert(mochiNFT.connect(alice).unpause(), 'Ownable: caller is not the owner');
  });

  it('Can not mint, setUri tokenId which has not been issued', async () => {
    await expectRevert(
      mochiNFT.connect(deployer).mint(alice.address, '0', '1', '0x'),
      'Invalid id'
    );

    await expectRevert(
      mochiNFT.connect(deployer).mint(alice.address, '1', '1', '0x'),
      'Invalid id'
    );

    await expectRevert(
      mochiNFT.connect(deployer).mintByBatch(alice.address, ['0', '1'], ['1', '1'], '0x'),
      'Invalid id'
    );

    await expectRevert(
      mochiNFT
        .connect(deployer)
        .mintByAddressBatch('0', [alice.address, bob.address], ['1', '1'], ['0x', '0x']),
      'Invalid id'
    );

    await expectRevert(
      mochiNFT
        .connect(deployer)
        .mintByAddressBatch('1', [alice.address, bob.address], ['1', '1'], ['0x', '0x']),
      'Invalid id'
    );

    await expectRevert(mochiNFT.connect(deployer).setUri('0', 'newUri'), 'Invalid id');
    await expectRevert(mochiNFT.connect(deployer).setUri('1', 'newUri'), 'Invalid id');
  });

  describe('Owner issueNewTokens successfully', async () => {
    let newTokens = ['newUri0', 'newUri1'];

    beforeEach(async () => {
      await mochiNFT.connect(deployer).issueNewTokens(newTokens);
      expect(await mochiNFT.uri(0)).to.be.equal(newTokens[0]);
      expect(await mochiNFT.uri(1)).to.be.equal(newTokens[1]);
      expect(parseInt(await mochiNFT.currentTokenId())).to.be.equal(2);
    });

    it('Check tokenUri and currentTokenId', async () => {
      expect(await mochiNFT.uri(0)).to.be.equal(newTokens[0]);
      expect(await mochiNFT.uri(1)).to.be.equal(newTokens[1]);
      expect(parseInt(await mochiNFT.currentTokenId())).to.be.equal(2);
    });

    it('Mint tokenId >= currentTokenId fail', async () => {
      await expectRevert(
        mochiNFT.connect(deployer).mint(alice.address, '2', '1', '0x'),
        'Invalid id'
      );
    });

    it('Mint successfully', async () => {
      await mochiNFT.connect(deployer).mint(alice.address, '0', '1', '0x');
      expect(parseInt(await mochiNFT.balanceOf(alice.address, '0'))).to.be.equal(1);

      await mochiNFT.connect(deployer).mint(alice.address, '1', '1', '0x');
      expect(parseInt(await mochiNFT.balanceOf(alice.address, '1'))).to.be.equal(1);

      expect(parseInt(await mochiNFT.totalSupply('0'))).to.be.equal(1);
      expect(parseInt(await mochiNFT.totalSupply('1'))).to.be.equal(1);
    });

    it('MintByIdBatch successfully', async () => {
      await mochiNFT.connect(deployer).mintByBatch(alice.address, ['0', '1'], ['1', '1'], '0x');

      expect(parseInt(await mochiNFT.balanceOf(alice.address, '0'))).to.be.equal(1);
      expect(parseInt(await mochiNFT.balanceOf(alice.address, '1'))).to.be.equal(1);

      expect(parseInt(await mochiNFT.totalSupply('0'))).to.be.equal(1);
      expect(parseInt(await mochiNFT.totalSupply('1'))).to.be.equal(1);
    });

    it('MintByAddressBatch successfully', async () => {
      await mochiNFT
        .connect(deployer)
        .mintByAddressBatch('0', [alice.address, bob.address], ['1', '1'], ['0x', '0x']);

      await mochiNFT
        .connect(deployer)
        .mintByAddressBatch('1', [alice.address, bob.address], ['1', '1'], ['0x', '0x']);

      expect(parseInt(await mochiNFT.totalSupply('0'))).to.be.equal(2);
      expect(parseInt(await mochiNFT.totalSupply('1'))).to.be.equal(2);

      expect(parseInt(await mochiNFT.balanceOf(alice.address, '0'))).to.be.equal(1);
      expect(parseInt(await mochiNFT.balanceOf(alice.address, '1'))).to.be.equal(1);

      expect(parseInt(await mochiNFT.balanceOf(bob.address, '0'))).to.be.equal(1);
      expect(parseInt(await mochiNFT.balanceOf(bob.address, '1'))).to.be.equal(1);
    });

    it('setUri successfully', async () => {
      await mochiNFT.connect(deployer).setUri('0', 'abc');
      await mochiNFT.connect(deployer).setUri('1', 'bcd');

      expect(await mochiNFT.uri('0')).to.be.equal('abc');
      expect(await mochiNFT.uri('1')).to.be.equal('bcd');
    });
  });

  describe('Owner issueNewTokenAndMint sucessfully', async () => {
    let newToken = 'newUri0';
    beforeEach(async () => {
      await mochiNFT
        .connect(deployer)
        .issueNewTokenAndMint(newToken, [alice.address, bob.address], ['1', '1'], ['0x', '0x']);
    });

    it('Check tokenUri and currentTokenId and totalSupply', async () => {
      expect(await mochiNFT.uri(0)).to.be.equal(newToken);
      expect(parseInt(await mochiNFT.currentTokenId())).to.be.equal(1);
      expect(parseInt(await mochiNFT.totalSupply(0))).to.be.equal(2);
    });

    it('Mint tokenId >= currentTokenId fail', async () => {
      await expectRevert(
        mochiNFT.connect(deployer).mint(alice.address, '1', '1', '0x'),
        'Invalid id'
      );
    });

    it('Mint successfully', async () => {
      await mochiNFT.connect(deployer).mint(alice.address, '0', '1', '0x');
      expect(parseInt(await mochiNFT.balanceOf(alice.address, '0'))).to.be.equal(2);

      expect(parseInt(await mochiNFT.totalSupply('0'))).to.be.equal(3);
    });

    it('MintByIdBatch successfully', async () => {
      await mochiNFT.connect(deployer).mintByBatch(alice.address, ['0'], ['1'], '0x');

      expect(parseInt(await mochiNFT.balanceOf(alice.address, '0'))).to.be.equal(2);

      expect(parseInt(await mochiNFT.totalSupply('0'))).to.be.equal(3);
    });

    it('MintByAddressBatch successfully', async () => {
      await mochiNFT
        .connect(deployer)
        .mintByAddressBatch('0', [alice.address, bob.address], ['1', '1'], ['0x', '0x']);

      expect(parseInt(await mochiNFT.totalSupply('0'))).to.be.equal(4);

      expect(parseInt(await mochiNFT.balanceOf(alice.address, '0'))).to.be.equal(2);

      expect(parseInt(await mochiNFT.balanceOf(bob.address, '0'))).to.be.equal(2);
    });

    it('setUri successfully', async () => {
      await mochiNFT.connect(deployer).setUri('0', 'abc');

      expect(await mochiNFT.uri('0')).to.be.equal('abc');
    });
  });
});
