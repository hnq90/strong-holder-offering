// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// SampleERC1155
contract SampleERC1155 is ERC1155Pausable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter internal _tokenIdCounter;
    string public name;
    string public symbol;
    mapping(uint256 => string) internal _tokenUri;
    mapping(uint256 => uint256) public totalSupply;

    constructor(string memory _name, string memory _symbol) ERC1155("") {
        name = _name;
        symbol = _symbol;
    }

    function issueNewTokens(string[] memory tokenUris)
        external
        onlyOwner
        returns (uint256[] memory)
    {
        uint256[] memory ids = new uint256[](tokenUris.length);
        for (uint256 i = 0; i < tokenUris.length; i++) {
            ids[i] = _tokenIdCounter.current();
            if (keccak256(abi.encodePacked(tokenUris[i])) != keccak256(abi.encodePacked(""))) {
                _tokenUri[ids[i]] = tokenUris[i];
            }
            _tokenIdCounter.increment();
        }
        return ids;
    }

    function issueNewTokenAndMint(
        string memory tokenUri,
        address[] memory accounts,
        uint256[] memory amounts,
        bytes[] memory data
    ) external onlyOwner returns (uint256) {
        require(
            accounts.length == amounts.length && amounts.length == data.length,
            "Parameters not match"
        );

        uint256 id = _tokenIdCounter.current();

        if (keccak256(abi.encodePacked(tokenUri)) != keccak256(abi.encodePacked(""))) {
            _tokenUri[id] = tokenUri;
        }

        uint256 totalMinted = 0;

        for (uint256 i = 0; i < accounts.length; i++) {
            _mint(accounts[i], id, amounts[i], data[i]);
            totalMinted = totalMinted + amounts[i];
        }

        totalSupply[id] = totalSupply[id] + totalMinted;
        _tokenIdCounter.increment();
        return id;
    }

    function mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external onlyOwner {
        require(id < _tokenIdCounter.current(), "Invalid id");
        totalSupply[id] = totalSupply[id] + amount;
        _mint(account, id, amount, data);
    }

    function mintByBatch(
        address account,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyOwner {
        for (uint256 i = 0; i < ids.length; i++) {
            require(ids[i] < _tokenIdCounter.current(), "Invalid id");
            totalSupply[ids[i]] = totalSupply[ids[i]] + amounts[i];
        }

        _mintBatch(account, ids, amounts, data);
    }

    function mintByAddressBatch(
        uint256 id,
        address[] memory accounts,
        uint256[] memory amounts,
        bytes[] memory data
    ) external onlyOwner {
        require(
            accounts.length == amounts.length && amounts.length == data.length,
            "Parameters not match"
        );

        require(id < _tokenIdCounter.current(), "Invalid id");

        uint256 totalMinted = 0;

        for (uint256 i = 0; i < accounts.length; i++) {
            _mint(accounts[i], id, amounts[i], data[i]);
            totalMinted = totalMinted + amounts[i];
        }

        totalSupply[id] = totalSupply[id] + totalMinted;
    }

    function burn(uint256 id, uint256 amount) external {
        totalSupply[id] = totalSupply[id] - amount;
        _burn(msg.sender, id, amount);
    }

    function burnBatch(uint256[] memory ids, uint256[] memory amounts) external {
        for (uint256 i = 0; i < ids.length; i++) {
            totalSupply[ids[i]] = totalSupply[ids[i]] - amounts[i];
        }
        _burnBatch(msg.sender, ids, amounts);
    }

    function setUri(uint256 id, string memory tokenUri) external onlyOwner {
        require(id < _tokenIdCounter.current(), "Invalid id");
        _tokenUri[id] = tokenUri;
    }

    function uri(uint256 id) public view override returns (string memory) {
        return _tokenUri[id];
    }

    function currentTokenId() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
