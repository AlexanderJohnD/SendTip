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

  const tabConfig = [
    { id: 'register', label: 'Register', icon: '👤' },
    { id: 'tip', label: 'Send Tip', icon: '💸' },
    { id: 'balance', label: 'Balance', icon: '💰' },
    { id: 'faucet', label: 'Faucet', icon: '🚰' }
  ];

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider locale="en">
          <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            <Header />
            <main style={{
              maxWidth: 1200,
              margin: '0 auto',
              padding: 'clamp(1rem, 4vw, 2rem)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(1rem, 3vw, 2rem)'
            }}>
              {/* Navigation Pills */}
              <nav style={{
                display: 'flex',
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                justifyContent: 'center',
                flexWrap: 'wrap',
                maxWidth: '100%',
                overflowX: 'auto'
              }}>
                {tabConfig.map(({ id, label, icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id as any)}
                    style={{
                      border: 'none',
                      background: tab === id
                        ? 'rgba(255, 255, 255, 0.9)'
                        : 'transparent',
                      color: tab === id ? '#1f2937' : 'rgba(255, 255, 255, 0.8)',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      minWidth: 'fit-content',
                      boxShadow: tab === id ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (tab !== id) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (tab !== id) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{icon}</span>
                    {label}
                  </button>
                ))}
              </nav>

              {/* Content Area */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 'clamp(16px, 3vw, 24px)',
                padding: 'clamp(1rem, 4vw, 2rem)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                minHeight: 'clamp(300px, 50vh, 400px)',
                width: '100%'
              }}>
                {tab === 'register' && <Register />}
                {tab === 'tip' && <Tip />}
                {tab === 'balance' && <Balance />}
                {tab === 'faucet' && <Faucet />}
              </div>
            </main>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
