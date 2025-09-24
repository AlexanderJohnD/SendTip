import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CUSDT_ADDRESS } from '../config/contracts';
import CUSDTAbi from '../abi/CUSDT';
import { Contract } from 'ethers';

export function Faucet() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const [amount, setAmount] = useState('10'); // default 10 CUSDT
  const [loading, setLoading] = useState(false);

  const toMicros = (val: string) => {
    const parts = val.trim().split('.');
    const whole = parts[0] || '0';
    let frac = parts[1] || '';
    if (frac.length > 6) frac = frac.slice(0, 6);
    while (frac.length < 6) frac += '0';
    // handle leading zeros
    const cleanWhole = whole.replace(/^0+(\d)/, '$1');
    const s = (cleanWhole || '0') + frac;
    return BigInt(s || '0');
  };

  const onMint = async () => {
    if (!address || !signerPromise) return;
    setLoading(true);
    try {
      const micros = toMicros(amount);
      const signer = await signerPromise;
      const c = new Contract(CUSDT_ADDRESS, CUSDTAbi as any, signer);
      const tx = await c.mint(address, micros);
      await tx.wait();
      alert('Minted');
    } catch (e: any) {
      alert(e?.shortMessage || e?.message || 'Mint failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '1rem'
        }}>
          🚰
        </div>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#1f2937',
          marginTop: 0,
          marginBottom: '0.5rem'
        }}>
          CUSDT Faucet
        </h2>
        <p style={{
          color: '#6b7280',
          fontSize: '1rem',
          margin: 0
        }}>
          Get free test CUSDT tokens for development
        </p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)',
        border: '1px solid #a855f7',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <div style={{ position: 'relative' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151'
            }}>
              Amount to Mint (CUSDT)
            </label>
            <div style={{
              position: 'absolute',
              left: '1rem',
              top: '2.25rem',
              transform: 'translateY(-50%)',
              color: '#6b7280',
              fontSize: '1rem',
              pointerEvents: 'none'
            }}>
              💎
            </div>
            <input
              placeholder="10.000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              step="0.000001"
              min="0"
              style={{
                width: '100%',
                padding: '1rem 1rem 1rem 2.5rem',
                borderRadius: '12px',
                border: '2px solid #e5e7eb',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                background: '#ffffff',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#a855f7';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <div style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              marginTop: '0.25rem'
            }}>
              Supports up to 6 decimal places. Default: 10 CUSDT
            </div>
          </div>

          <button
            onClick={onMint}
            disabled={!address || loading || !amount}
            style={{
              padding: '1rem 2rem',
              borderRadius: '12px',
              border: 'none',
              background: (!address || loading || !amount)
                ? '#d1d5db'
                : 'linear-gradient(135deg, #a855f7, #7c3aed)',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: (!address || loading || !amount) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: (!address || loading || !amount)
                ? 'none'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              if (!(!address || loading || !amount)) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 15px -3px rgba(0, 0, 0, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!(!address || loading || !amount)) {
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            {loading && (
              <div style={{
                width: '1rem',
                height: '1rem',
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            )}
            {loading ? 'Minting Tokens...' : 'Mint Free CUSDT'}
          </button>

          {!address && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '0.875rem',
              textAlign: 'center'
            }}>
              ⚠️ Please connect your wallet first
            </div>
          )}

          <div style={{
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '12px',
            padding: '1rem'
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: '#374151',
              lineHeight: '1.5'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                ℹ️ Faucet Information
              </div>
              <ul style={{
                margin: 0,
                paddingLeft: '1.5rem',
                color: '#6b7280'
              }}>
                <li>Free test tokens for Sepolia testnet</li>
                <li>Use these tokens to test confidential transactions</li>
                <li>Tokens have no real-world value</li>
                <li>Mint as many as needed for testing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
