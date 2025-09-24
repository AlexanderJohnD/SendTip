import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk';
import { parseEther } from 'viem';
import './App.css';

// Contract ABIs - 在实际项目中应该从编译后的合约中导入
const SENDTIP_ABI = [
  {
    "inputs": [{"type": "string", "name": "githubUsername"}],
    "name": "registerGithubUser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"type": "string", "name": "toGithubUsername"},
      {"type": "bytes32", "name": "encryptedAmount"},
      {"type": "bytes", "name": "inputProof"}
    ],
    "name": "sendTip",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"type": "address", "name": "wallet"}],
    "name": "getGithubUsername",
    "outputs": [{"type": "string", "name": ""}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalTipsReceived",
    "outputs": [{"type": "bytes32", "name": ""}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalTipsSent",
    "outputs": [{"type": "bytes32", "name": ""}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBalance",
    "outputs": [{"type": "bytes32", "name": ""}],
    "stateMutability": "view",
    "type": "function"
  }
];

// 合约地址 - 需要在部署后更新
const SENDTIP_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

function App() {
  const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  const [fhevmInstance, setFhevmInstance] = useState<any>(null);
  
  // UI状态
  const [githubUsername, setGithubUsername] = useState('');
  const [targetGithubUsername, setTargetGithubUsername] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userGithubName, setUserGithubName] = useState('');

  // 获取用户的GitHub用户名
  const { data: currentGithubUsername } = useReadContract({
    address: SENDTIP_CONTRACT_ADDRESS as `0x${string}`,
    abi: SENDTIP_ABI,
    functionName: 'getGithubUsername',
    args: [address],
    query: { enabled: !!address }
  });

  // 初始化FHEVM实例
  useEffect(() => {
    const initFHEVM = async () => {
      try {
        const instance = await createInstance(SepoliaConfig);
        setFhevmInstance(instance);
      } catch (error) {
        console.error('Failed to initialize FHEVM:', error);
      }
    };
    
    initFHEVM();
  }, []);

  useEffect(() => {
    if (currentGithubUsername && typeof currentGithubUsername === 'string') {
      setUserGithubName(currentGithubUsername);
    }
  }, [currentGithubUsername]);

  // 注册GitHub用户名
  const handleRegisterGithub = async () => {
    if (!githubUsername.trim()) {
      alert('请输入GitHub用户名');
      return;
    }

    setIsLoading(true);
    try {
      await writeContract({
        address: SENDTIP_CONTRACT_ADDRESS as `0x${string}`,
        abi: SENDTIP_ABI,
        functionName: 'registerGithubUser',
        args: [githubUsername],
      });
      
      alert('GitHub用户名注册成功！');
      setGithubUsername('');
    } catch (error) {
      console.error('注册失败:', error);
      alert('注册失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 发送tip
  const handleSendTip = async () => {
    if (!targetGithubUsername.trim() || !tipAmount.trim()) {
      alert('请填写所有字段');
      return;
    }

    if (!fhevmInstance) {
      alert('FHEVM实例未初始化');
      return;
    }

    setIsLoading(true);
    try {
      // 创建加密输入
      const input = fhevmInstance.createEncryptedInput(
        SENDTIP_CONTRACT_ADDRESS,
        address
      );
      
      // 将金额转换为整数并加密
      const amountInWei = Math.floor(parseFloat(tipAmount) * 1000000); // 假设使用6位小数
      input.add64(BigInt(amountInWei));
      
      const encryptedInput = await input.encrypt();
      
      await writeContract({
        address: SENDTIP_CONTRACT_ADDRESS as `0x${string}`,
        abi: SENDTIP_ABI,
        functionName: 'sendTip',
        args: [
          targetGithubUsername,
          encryptedInput.handles[0],
          encryptedInput.inputProof
        ],
      });
      
      alert('Tip发送成功！');
      setTargetGithubUsername('');
      setTipAmount('');
    } catch (error) {
      console.error('发送tip失败:', error);
      alert('发送失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🚀 SendTip</h1>
        <p>基于Zama FHE的保密GitHub打赏平台</p>
        <ConnectButton />
      </header>

      {isConnected && (
        <main className="main-content">
          {/* 用户状态 */}
          <div className="user-status">
            <h2>用户状态</h2>
            {userGithubName ? (
              <p>✅ 已注册GitHub用户名: <strong>{userGithubName}</strong></p>
            ) : (
              <p>❌ 未注册GitHub用户名</p>
            )}
            <p>钱包地址: {address}</p>
          </div>

          {/* 注册GitHub用户名 */}
          {!userGithubName && (
            <div className="register-section">
              <h2>注册GitHub用户名</h2>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="输入你的GitHub用户名"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  disabled={isLoading}
                />
                <button 
                  onClick={handleRegisterGithub}
                  disabled={isLoading}
                  className="primary-button"
                >
                  {isLoading ? '注册中...' : '注册'}
                </button>
              </div>
            </div>
          )}

          {/* 发送tip */}
          {userGithubName && (
            <div className="send-tip-section">
              <h2>发送Tip</h2>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="目标GitHub用户名"
                  value={targetGithubUsername}
                  onChange={(e) => setTargetGithubUsername(e.target.value)}
                  disabled={isLoading}
                />
                <input
                  type="number"
                  placeholder="金额 (CUSDT)"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  disabled={isLoading}
                  min="0"
                  step="0.000001"
                />
                <button 
                  onClick={handleSendTip}
                  disabled={isLoading}
                  className="primary-button"
                >
                  {isLoading ? '发送中...' : '发送Tip'}
                </button>
              </div>
            </div>
          )}

          {/* 说明 */}
          <div className="info-section">
            <h2>如何使用</h2>
            <ol>
              <li>连接你的钱包</li>
              <li>注册你的GitHub用户名到链上</li>
              <li>向其他GitHub用户发送保密的CUSDT tip</li>
              <li>所有交易都使用Zama FHE加密，保护隐私</li>
            </ol>
          </div>
        </main>
      )}

      {!isConnected && (
        <div className="connect-prompt">
          <h2>请连接钱包开始使用</h2>
          <p>使用SendTip向GitHub开发者发送保密的代币奖励</p>
        </div>
      )}
    </div>
  );
}

export default App;
