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
    uint256 public amountMomaPerNFT;

    // tokenId => bool
    mapping(uint256 => bool) public _tokenIdCanClaim;

    mapping(address => mapping(uint256 => bool)) public claimed;

    modifier whenNFTPaused() {
        require(Pausable(erc1155).paused() == true, "NFT not paused");
        _;
    }

    constructor(
        address _erc1155,
        address _moma,
        uint256[] memory _tokenId,
        uint256 _amountMomaPerNFT,
        uint256 _endBlock
    ) {
        require(_endBlock > block.number, "Invalid endBlock");
        for (uint256 i = 0; i < _tokenId.length; i++) {
            _tokenIdCanClaim[_tokenId[i]] = true;
        }

        amountMomaPerNFT = _amountMomaPerNFT;
        erc1155 = _erc1155;
        moma = _moma;
        endBlock = _endBlock;
    }

    function claim(uint256 _tokenId) external whenNFTPaused {
        require(block.number < endBlock, "Claim was ended");
        require(_tokenIdCanClaim[_tokenId] == true, "Invalid tokenId");
        require(IERC1155(erc1155).balanceOf(_msgSender(), _tokenId) > 0, "You do not own NFT");
        require(claimed[_msgSender()][_tokenId] == false, "You claimed this tokenId");
        require(
            IERC20(moma).balanceOf(address(this)) >= amountMomaPerNFT,
            "Not enough balance to claim"
        );

        claimed[_msgSender()][_tokenId] = true;
        IERC20(moma).safeTransfer(_msgSender(), amountMomaPerNFT);
    }

    function withdrawFunds(address _token) external onlyOwner {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).safeTransfer(_msgSender(), balance);
    }

    function forceEnd() external onlyOwner {
        endBlock = block.number;
        uint256 balance = IERC20(moma).balanceOf(address(this));
        IERC20(moma).safeTransfer(_msgSender(), balance);
    }
}
