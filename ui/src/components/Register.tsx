import { useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { Contract } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { SENDTIP_ADDRESS } from '../config/contracts';
import SendTipAbi from '../abi/SendTip';

export function Register() {
  const { address } = useAccount();
  const [github, setGithub] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const signerPromise = useEthersSigner();
  const publicClient = usePublicClient();

  const onRegister = async () => {
    if (!github || !signerPromise) return;
    setSubmitting(true);
    try {
      const signer = await signerPromise;
      const c = new Contract(SENDTIP_ADDRESS, SendTipAbi as any, signer);
      const tx = await c.registerGithub(github);
      await tx.wait();
      alert('Registered');
    } catch (e: any) {
      alert(e?.message || 'Failed');
    } finally {
      setSubmitting(false);
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
          👤
        </div>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#1f2937',
          marginTop: 0,
          marginBottom: '0.5rem'
        }}>
          Register GitHub Account
        </h2>
        <p style={{
          color: '#6b7280',
          fontSize: '1rem',
          margin: 0
        }}>
          Link your GitHub username to receive confidential tips
        </p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
        border: '1px solid #bae6fd',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280',
              fontSize: '1.25rem',
              pointerEvents: 'none'
            }}>
              @
            </div>
            <input
              placeholder="Enter your GitHub username"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
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
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            disabled={!address || submitting || !github}
            onClick={onRegister}
            style={{
              padding: '1rem 2rem',
              borderRadius: '12px',
              border: 'none',
              background: (!address || submitting || !github)
                ? '#d1d5db'
                : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: (!address || submitting || !github) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: (!address || submitting || !github)
                ? 'none'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              if (!(!address || submitting || !github)) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 15px -3px rgba(0, 0, 0, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!(!address || submitting || !github)) {
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            {submitting && (
              <div style={{
                width: '1rem',
                height: '1rem',
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            )}
            {submitting ? 'Registering...' : 'Register Account'}
          </button>

          {!address && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '8px',
              color: '#92400e',
              fontSize: '0.875rem',
              textAlign: 'center'
            }}>
              ⚠️ Please connect your wallet first
            </div>
          )}
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
