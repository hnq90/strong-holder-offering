// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// ERC1155
contract SampleERC1155 is ERC1155, Ownable {
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

    function issueNewTokens(string[] memory tokenUri)
        external
        onlyOwner
        returns (uint256[] memory)
    {
        uint256[] memory ids = new uint256[](tokenUri.length);
        for (uint256 i = 0; i < tokenUri.length; i++) {
            ids[i] = _tokenIdCounter.current();
            if (keccak256(abi.encodePacked(tokenUri[i])) != keccak256(abi.encodePacked(""))) {
                _tokenUri[ids[i]] = tokenUri[i];
            }
            _tokenIdCounter.increment();
        }
        return ids;
    }

    function issueNewTokenAndMint(
        string memory tokenUri,
        address[] memory account,
        uint256[] memory amount,
        bytes[] memory data
    ) external onlyOwner returns (uint256) {
        require(
            account.length == amount.length && amount.length == data.length,
            "Parameters not match"
        );

        uint256 id = _tokenIdCounter.current();

        if (keccak256(abi.encodePacked(tokenUri)) != keccak256(abi.encodePacked(""))) {
            _tokenUri[id] = tokenUri;
        }

        uint256 totalMinted = 0;

        for (uint256 i = 0; i < account.length; i++) {
            _mint(account[i], id, amount[i], data[i]);
            totalMinted = totalMinted + amount[i];
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
        require(id <= _tokenIdCounter.current(), "Invalid id");
        totalSupply[id] = totalSupply[id] + amount;
        _mint(account, id, amount, data);
    }

    function mintByBatchId(
        address account,
        uint256[] memory id,
        uint256[] memory amount,
        bytes memory data
    ) external onlyOwner {
        for (uint256 i = 0; i < id.length; i++) {
            require(id[i] <= _tokenIdCounter.current(), "Invalid id");
            totalSupply[id[i]] = totalSupply[id[i]] + amount[i];
        }

        _mintBatch(account, id, amount, data);
    }

    function mintByAddressBatch(
        uint256 id,
        address[] memory account,
        uint256[] memory amount,
        bytes[] memory data
    ) external onlyOwner {
        require(
            account.length == amount.length && amount.length == data.length,
            "Parameters not match"
        );

        require(id <= _tokenIdCounter.current(), "Invalid id");

        uint256 totalMinted = 0;

        for (uint256 i = 0; i < account.length; i++) {
            _mint(account[i], id, amount[i], data[i]);
            totalMinted = totalMinted + amount[i];
        }

        totalSupply[id] = totalSupply[id] + totalMinted;
    }

    function burn(uint256 id, uint256 amount) external {
        totalSupply[id] = totalSupply[id] - amount;
        _burn(msg.sender, id, amount);
    }

    function burnBatch(uint256[] memory id, uint256[] memory amount) external {
        for (uint256 i = 0; i < id.length; i++) {
            totalSupply[id[i]] = totalSupply[id[i]] - amount[i];
        }
        _burnBatch(msg.sender, id, amount);
    }

    function setUri(uint256 id, string memory tokenUri) external onlyOwner {
        require(id <= _tokenIdCounter.current(), "Invalid id");
        _tokenUri[id] = tokenUri;
    }

    function uri(uint256 id) public view override returns (string memory) {
        return _tokenUri[id];
    }

    function currentTokenId() public view returns (uint256) {
        return _tokenIdCounter.current();
    }
}
