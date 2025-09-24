// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {ConfidentialFungibleToken} from "new-confidential-contracts/token/ConfidentialFungibleToken.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";

contract CUSDT is ConfidentialFungibleToken, SepoliaConfig {
    event Mint(address indexed to, euint64 encryptedAmount);

    constructor() ConfidentialFungibleToken("Confidential USDT", "CUSDT", "") {}

    function mint(address to, uint64 amount) public onlyOwner {
        euint64 encryptedAmount = FHE.asEuint64(amount);
        _mint(to, encryptedAmount);
    }

    // 这些函数已经在ConfidentialFungibleToken中定义，无需重复定义
}
