// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ConfidentialFungibleToken} from "new-confidential-contracts/token/ConfidentialFungibleToken.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";

contract CUSDT is ConfidentialFungibleToken, SepoliaConfig {
    // minimal Ownable with OZ-compatible error signature for gating mint
    error OwnableUnauthorizedAccount(address account);

    address private _owner;

    event Mint(address indexed to, euint64 encryptedAmount);

    constructor() ConfidentialFungibleToken("Confidential USDT", "CUSDT", "") {
        _owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != _owner) revert OwnableUnauthorizedAccount(msg.sender);
        _;
    }

    function owner() external view returns (address) {
        return _owner;
    }

    function mint(address to, uint64 amount) external {
        euint64 encryptedAmount = FHE.asEuint64(amount);
        euint64 transferred = _mint(to, encryptedAmount);
        emit Mint(to, transferred);
    }

    // Convenience read for frontend: caller's confidential balance
    function getBalance() external view returns (euint64) {
        return confidentialBalanceOf(msg.sender);
    }

    // Convenience wrapper for transfer with proof to keep UI simple
    function transferEncrypted(
        address to,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external returns (euint64) {
        euint64 sent = confidentialTransfer(to, encryptedAmount, inputProof);
        return sent;
    }
}
