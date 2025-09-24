// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {ConfidentialFungibleToken} from "@openzeppelin/confidential-contracts/token/ConfidentialFungibleToken.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CUSDT is ConfidentialFungibleToken, SepoliaConfig, Ownable {
    
    event Mint(address indexed to, euint64 encryptedAmount);
    
    constructor() 
        ConfidentialFungibleToken("Confidential USDT", "CUSDT", "") 
        Ownable(msg.sender)
    {}

    function mint(address to, uint64 amount) public onlyOwner {
        euint64 encryptedAmount = FHE.asEuint64(amount);
        _mint(to, encryptedAmount);
        
        // Grant ACL permissions
        FHE.allowThis(encryptedAmount);
        FHE.allow(encryptedAmount, to);
        
        emit Mint(to, encryptedAmount);
    }
    
    // 这些函数已经在ConfidentialFungibleToken中定义，无需重复定义
}
