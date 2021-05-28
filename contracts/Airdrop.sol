// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Airdrop
contract Airdrop is Ownable {
    using SafeERC20 for IERC20;

    address public erc1155;
    address public moma;
    uint256 public endBlock;

    // tokenId => amount MOMA
    mapping(uint256 => uint256) public tokenIdToAmount;
    mapping(address => mapping(uint256 => bool)) internal _claimed;

    modifier whenNFTPaused() {
        require(Pausable(erc1155).paused() == true, "NFT not paused");
        _;
    }

    constructor(
        address _erc1155,
        address _moma,
        uint256[] memory _tokenId,
        uint256[] memory _amountMoma,
        uint256 _endBlock
    ) {
        require(_tokenId.length == _amountMoma.length, "Parameter not match");
        require(_endBlock > block.number, "Invalid endBlock");

        for (uint256 i = 0; i < _tokenId.length; i++) {
            tokenIdToAmount[_tokenId[i]] = _amountMoma[i];
        }

        erc1155 = _erc1155;
        moma = _moma;
        endBlock = _endBlock;
    }

    function claim(uint256 _tokenId) external whenNFTPaused {
        require(block.number < endBlock, "Claim was ended");
        require(tokenIdToAmount[_tokenId] > 0, "Invald tokenId");
        require(IERC1155(erc1155).balanceOf(_msgSender(), _tokenId) > 0, "You do not own NFT");
        require(_claimed[_msgSender()][_tokenId] == false, "You claimed this tokenId");
        require(IERC20(moma).balanceOf(address(this)) >= tokenIdToAmount[_tokenId], "Not enough balance to claim" );

        _claimed[_msgSender()][_tokenId] = true;
        IERC20(moma).safeTransfer(_msgSender(), tokenIdToAmount[_tokenId]);
    }

    function withdrawFunds() external onlyOwner {
        uint256 balance = IERC20(moma).balanceOf(address(this));
        IERC20(moma).safeTransfer(_msgSender(), balance);
    }

    function forceEnd() external onlyOwner {
        endBlock = block.number;
        uint256 balance = IERC20(moma).balanceOf(address(this));
        IERC20(moma).safeTransfer(_msgSender(), balance);
    }
}
