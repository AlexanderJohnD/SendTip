import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

import { config } from './config/wagmi';
import { Header } from './components/Header';
import { Register } from './components/Register';
import { Tip } from './components/Tip';
import { Balance } from './components/Balance';
import { Faucet } from './components/Faucet';
import { useState } from 'react';

const queryClient = new QueryClient();

function App() {
  const [tab, setTab] = useState<'register' | 'tip' | 'balance' | 'faucet'>('register');

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider locale="en">
          <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            <Header />
            <main style={{ maxWidth: 880, margin: '0 auto', padding: '1.5rem 1rem' }}>
              <nav style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                <button onClick={() => setTab('register')} style={{ border: 'none', background: 'none', borderBottom: tab === 'register' ? '2px solid #2563eb' : '2px solid transparent', paddingBottom: 8, cursor: 'pointer', color: tab === 'register' ? '#2563eb' : '#6b7280' }}>Register</button>
                <button onClick={() => setTab('tip')} style={{ border: 'none', background: 'none', borderBottom: tab === 'tip' ? '2px solid #2563eb' : '2px solid transparent', paddingBottom: 8, cursor: 'pointer', color: tab === 'tip' ? '#2563eb' : '#6b7280' }}>Send Tip</button>
                <button onClick={() => setTab('balance')} style={{ border: 'none', background: 'none', borderBottom: tab === 'balance' ? '2px solid #2563eb' : '2px solid transparent', paddingBottom: 8, cursor: 'pointer', color: tab === 'balance' ? '#2563eb' : '#6b7280' }}>Balance</button>
                <button onClick={() => setTab('faucet')} style={{ border: 'none', background: 'none', borderBottom: tab === 'faucet' ? '2px solid #2563eb' : '2px solid transparent', paddingBottom: 8, cursor: 'pointer', color: tab === 'faucet' ? '#2563eb' : '#6b7280' }}>Faucet</button>
              </nav>
              {tab === 'register' && <Register />}
              {tab === 'tip' && <Tip />}
              {tab === 'balance' && <Balance />}
              {tab === 'faucet' && <Faucet />}
            </main>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App
