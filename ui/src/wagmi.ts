import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  sepolia,
  hardhat,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'SendTip',
  projectId: 'YOUR_PROJECT_ID', // 替换为您的WalletConnect项目ID
  chains: [sepolia, hardhat],
  ssr: false, // 如果您的dApp使用服务器端渲染（SSR）
});