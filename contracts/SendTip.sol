// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SendTip is SepoliaConfig, Ownable {
    
    // CUSDT代币余额映射
    mapping(address => euint64) private balances;
    
    // GitHub用户名到钱包地址的映射
    mapping(string => address) public githubToWallet;
    
    // 钱包地址到GitHub用户名的映射
    mapping(address => string) public walletToGithub;
    
    // 用户的总收到tip记录（加密）
    mapping(address => euint64) public totalTipsReceived;
    
    // 用户的总发送tip记录（加密）
    mapping(address => euint64) public totalTipsSent;
    
    // 记录用户注册状态
    mapping(address => bool) public isRegistered;
    mapping(string => bool) public githubUsernameExists;
    
    // 代币总供应量
    euint64 private totalSupply;
    
    // 事件
    event GitHubRegistered(address indexed wallet, string githubUsername);
    event TipSent(
        address indexed from, 
        address indexed to, 
        string indexed toGitHub, 
        euint64 encryptedAmount
    );
    event Mint(address indexed to, euint64 encryptedAmount);
    
    // 错误定义
    error AlreadyRegistered();
    error GitHubUsernameTaken();
    error NotRegistered();
    error UserNotFound();
    error InsufficientBalance();
    error InvalidAmount();
    
    constructor() Ownable(msg.sender) {
        totalSupply = FHE.asEuint64(0);
    }
    
    /**
     * @dev 铸造CUSDT代币给用户
     * @param to 接收者地址
     * @param amount 铸造数量
     */
    function mint(address to, uint64 amount) public onlyOwner {
        euint64 encryptedAmount = FHE.asEuint64(amount);
        
        // 更新余额和总供应量
        balances[to] = FHE.add(balances[to], encryptedAmount);
        totalSupply = FHE.add(totalSupply, encryptedAmount);
        
        // 设置ACL权限
        FHE.allowThis(balances[to]);
        FHE.allow(balances[to], to);
        FHE.allowThis(totalSupply);
        
        emit Mint(to, encryptedAmount);
    }
    
    /**
     * @dev 注册GitHub用户名到钱包地址的映射
     * @param githubUsername GitHub用户名
     */
    function registerGithubUser(string calldata githubUsername) external {
        if (isRegistered[msg.sender]) {
            revert AlreadyRegistered();
        }
        
        if (githubUsernameExists[githubUsername]) {
            revert GitHubUsernameTaken();
        }
        
        require(bytes(githubUsername).length > 0, "GitHub username cannot be empty");
        require(bytes(githubUsername).length <= 39, "GitHub username too long");
        
        // 注册映射关系
        githubToWallet[githubUsername] = msg.sender;
        walletToGithub[msg.sender] = githubUsername;
        isRegistered[msg.sender] = true;
        githubUsernameExists[githubUsername] = true;
        
        // 初始化tip记录为0
        euint64 zero = FHE.asEuint64(0);
        totalTipsReceived[msg.sender] = zero;
        totalTipsSent[msg.sender] = zero;
        
        // 设置ACL权限
        FHE.allowThis(totalTipsReceived[msg.sender]);
        FHE.allow(totalTipsReceived[msg.sender], msg.sender);
        FHE.allowThis(totalTipsSent[msg.sender]);
        FHE.allow(totalTipsSent[msg.sender], msg.sender);
        
        emit GitHubRegistered(msg.sender, githubUsername);
    }
    
    /**
     * @dev 内部发送tip函数
     */
    function _sendTip(
        string calldata toGithubUsername,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) internal {
        if (!isRegistered[msg.sender]) {
            revert NotRegistered();
        }
        
        address toAddress = githubToWallet[toGithubUsername];
        if (toAddress == address(0)) {
            revert UserNotFound();
        }
        
        // 验证加密输入
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        
        // 检查发送者是否有足够余额
        ebool canTransfer = FHE.le(amount, balances[msg.sender]);
        
        // 检查金额是否大于0
        euint64 zero = FHE.asEuint64(0);
        ebool isPositive = FHE.gt(amount, zero);
        
        // 只有在余额充足且金额大于0时才执行转账
        ebool shouldTransfer = FHE.and(canTransfer, isPositive);
        
        // 使用FHE.select进行条件转账
        euint64 actualAmount = FHE.select(shouldTransfer, amount, zero);
        
        // 更新余额
        balances[msg.sender] = FHE.sub(balances[msg.sender], actualAmount);
        balances[toAddress] = FHE.add(balances[toAddress], actualAmount);
        
        // 更新统计记录
        totalTipsSent[msg.sender] = FHE.add(totalTipsSent[msg.sender], actualAmount);
        totalTipsReceived[toAddress] = FHE.add(totalTipsReceived[toAddress], actualAmount);
        
        // 设置ACL权限
        FHE.allowThis(balances[msg.sender]);
        FHE.allow(balances[msg.sender], msg.sender);
        FHE.allowThis(balances[toAddress]);
        FHE.allow(balances[toAddress], toAddress);
        FHE.allowThis(totalTipsSent[msg.sender]);
        FHE.allow(totalTipsSent[msg.sender], msg.sender);
        FHE.allowThis(totalTipsReceived[toAddress]);
        FHE.allow(totalTipsReceived[toAddress], toAddress);
        
        emit TipSent(msg.sender, toAddress, toGithubUsername, actualAmount);
    }

    /**
     * @dev 向GitHub用户发送tip（外部接口）
     * @param toGithubUsername 目标GitHub用户名
     * @param encryptedAmount 加密的tip金额
     * @param inputProof 输入证明
     */
    function sendTip(
        string calldata toGithubUsername,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external {
        _sendTip(toGithubUsername, encryptedAmount, inputProof);
    }
    
    /**
     * @dev 获取用户的CUSDT余额
     */
    function getBalance() external view returns (euint64) {
        return balances[msg.sender];
    }
    
    /**
     * @dev 获取指定地址的余额（仅限owner或用户本人）
     */
    function getBalanceOf(address account) external view returns (euint64) {
        require(
            msg.sender == account || msg.sender == owner(),
            "Not authorized to view balance"
        );
        return balances[account];
    }
    
    /**
     * @dev 获取用户收到的总tip数量
     */
    function getTotalTipsReceived() external view returns (euint64) {
        require(isRegistered[msg.sender], "Not registered");
        return totalTipsReceived[msg.sender];
    }
    
    /**
     * @dev 获取用户发送的总tip数量
     */
    function getTotalTipsSent() external view returns (euint64) {
        require(isRegistered[msg.sender], "Not registered");
        return totalTipsSent[msg.sender];
    }
    
    /**
     * @dev 根据钱包地址获取GitHub用户名
     */
    function getGithubUsername(address wallet) external view returns (string memory) {
        return walletToGithub[wallet];
    }
    
    /**
     * @dev 根据GitHub用户名获取钱包地址
     */
    function getWalletAddress(string calldata githubUsername) external view returns (address) {
        return githubToWallet[githubUsername];
    }
    
    /**
     * @dev 检查GitHub用户名是否已存在
     */
    function isGithubUsernameTaken(string calldata githubUsername) external view returns (bool) {
        return githubUsernameExists[githubUsername];
    }
    
    /**
     * @dev 获取代币总供应量（仅限owner）
     */
    function getTotalSupply() external view onlyOwner returns (euint64) {
        return totalSupply;
    }
    
    /**
     * @dev 批量发送tip（可选功能）
     * @param toGithubUsernames 目标GitHub用户名数组
     * @param encryptedAmounts 加密的tip金额数组
     * @param inputProofs 输入证明数组
     */
    function batchSendTips(
        string[] calldata toGithubUsernames,
        externalEuint64[] calldata encryptedAmounts,
        bytes[] calldata inputProofs
    ) external {
        require(
            toGithubUsernames.length == encryptedAmounts.length && 
            encryptedAmounts.length == inputProofs.length,
            "Array lengths mismatch"
        );
        
        require(toGithubUsernames.length <= 10, "Too many tips at once");
        
        for (uint i = 0; i < toGithubUsernames.length; i++) {
            _sendTip(toGithubUsernames[i], encryptedAmounts[i], inputProofs[i]);
        }
    }
}