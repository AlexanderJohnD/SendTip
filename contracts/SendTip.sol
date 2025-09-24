// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SendTip Registry
/// @notice Minimal registry to map GitHub usernames to wallet addresses.
///         No verification is performed; last write wins.
contract SendTip {
    // github username (lowercased) => address
    mapping(string => address) private _githubToAddress;
    // address => github username (lowercased)
    mapping(address => string) private _addressToGithub;

    event GithubRegistered(address indexed user, string indexed github);

    /// @notice Register or update your GitHub username.
    /// @param github The GitHub username (case-insensitive). Stored as provided.
    function registerGithub(string calldata github) external {
        _githubToAddress[github] = msg.sender;
        _addressToGithub[msg.sender] = github;
        emit GithubRegistered(msg.sender, github);
    }

    /// @notice Resolve an address by GitHub username.
    function getAddressByGithub(string calldata github) external view returns (address) {
        return _githubToAddress[github];
    }

    /// @notice Resolve a GitHub username by address.
    function getGithubByAddress(address user) external view returns (string memory) {
        return _addressToGithub[user];
    }
}

