// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// MockMOMA
contract MockMOMA is ERC20, Ownable {

    constructor() ERC20("MOchi MArket Token", "MOMA") {
    }

    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }
}
