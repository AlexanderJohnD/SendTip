import { useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { Contract } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CUSDT_ADDRESS, SENDTIP_ADDRESS } from '../config/contracts';
import CUSDTAbi from '../abi/CUSDT';
import SendTipAbi from '../abi/SendTip';

export function Tip() {
  const { address } = useAccount();
  const [github, setGithub] = useState('');
  const [amount, setAmount] = useState(''); // in micro-units string or decimal? use whole units with 6 decimals
  const { instance, isLoading } = useZamaInstance();
  const signerPromise = useEthersSigner();
  const publicClient = usePublicClient();
  const [submitting, setSubmitting] = useState(false);

  const onSend = async () => {
    if (!instance || !address || !signerPromise || !github || !amount) return;
    setSubmitting(true);
    try {
      // resolve recipient via viem read
      const to = await publicClient!.readContract({
        address: SENDTIP_ADDRESS as `0x${string}`,
        abi: SendTipAbi as any,
        functionName: 'getAddressByGithub',
        args: [github],
      });

      if (!to || to === '0x0000000000000000000000000000000000000000') {
        alert('GitHub not registered');
        setSubmitting(false);
        return;
      }

      // convert to micro (6 decimals)
      const parts = amount.split('.');
      let micros = parts[0];
      let frac = parts[1] || '';
      if (frac.length > 6) frac = frac.slice(0, 6);
      while (frac.length < 6) frac += '0';
      const amt = BigInt(micros + frac);

      // create encrypted amount input for CUSDT
      const buffer = instance.createEncryptedInput(CUSDT_ADDRESS, address);
      buffer.add64(amt);
      const enc = await buffer.encrypt();

      const signer = await signerPromise;
      const cusdt = new Contract(CUSDT_ADDRESS, CUSDTAbi as any, signer);
      // disambiguate overload explicitly
      const tx = await (cusdt as any)["confidentialTransfer(address,bytes32,bytes)"](to, enc.handles[0], enc.inputProof);
      await tx.wait();
      alert('Sent');
    } catch (e: any) {
      console.error(e);
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
          💸
        </div>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#1f2937',
          marginTop: 0,
          marginBottom: '0.5rem'
        }}>
          Send Confidential Tip
        </h2>
        <p style={{
          color: '#6b7280',
          fontSize: '1rem',
          margin: 0
        }}>
          Send CUSDT tips privately to any GitHub user
        </p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
        border: '1px solid #fbbf24',
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
              Recipient GitHub Username
            </label>
            <div style={{
              position: 'absolute',
              left: '1rem',
              top: '2.25rem',
              transform: 'translateY(-50%)',
              color: '#6b7280',
              fontSize: '1.25rem',
              pointerEvents: 'none'
            }}>
              @
            </div>
            <input
              placeholder="Enter GitHub username"
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
                e.currentTarget.style.borderColor = '#f59e0b';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151'
            }}>
              Amount (CUSDT)
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
              💰
            </div>
            <input
              placeholder="0.000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              step="0.000001"
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
                e.currentTarget.style.borderColor = '#f59e0b';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
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
              Supports up to 6 decimal places
            </div>
          </div>

          <button
            disabled={!address || !instance || submitting || !github || !amount}
            onClick={onSend}
            style={{
              padding: '1rem 2rem',
              borderRadius: '12px',
              border: 'none',
              background: (!address || !instance || submitting || !github || !amount)
                ? '#d1d5db'
                : 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: (!address || !instance || submitting || !github || !amount) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: (!address || !instance || submitting || !github || !amount)
                ? 'none'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              if (!(!address || !instance || submitting || !github || !amount)) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 15px -3px rgba(0, 0, 0, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!(!address || !instance || submitting || !github || !amount)) {
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
            {submitting ? 'Sending Tip...' : 'Send Confidential Tip'}
          </button>

          {(!address || !instance) && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '0.875rem',
              textAlign: 'center'
            }}>
              {!address ? '⚠️ Please connect your wallet first' : '⚠️ Zama instance loading...'}
            </div>
          )}

          {isLoading && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              color: '#2563eb',
              fontSize: '0.875rem',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '1rem',
                height: '1rem',
                border: '2px solid transparent',
                borderTop: '2px solid #2563eb',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Loading encryption system...
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
