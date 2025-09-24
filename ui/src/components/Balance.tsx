import { useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { CUSDT_ADDRESS } from '../config/contracts';
import CUSDTAbi from '../abi/CUSDT';
import { useEthersSigner } from '../hooks/useEthersSigner';

export function Balance() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { instance } = useZamaInstance();
  const signerPromise = useEthersSigner();
  const [handle, setHandle] = useState<string>('');
  const [clear, setClear] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const shortenHex = (hex: string, lead = 3, tail = 3) => {
    if (!hex || typeof hex !== 'string') return '';
    if (!hex.startsWith('0x')) return hex;
    const core = hex.slice(2);
    if (core.length <= lead + tail) return hex;
    return `0x${core.slice(0, lead)}***${core.slice(core.length - tail)}`;
  };

  const onFetch = async () => {
    if (!address) return;
    setLoading(true);
    try {
      // read encrypted balance handle (bytes32) for caller
      const enc = await publicClient!.readContract({
        address: CUSDT_ADDRESS as `0x${string}`,
        abi: CUSDTAbi as any,
        functionName: 'confidentialBalanceOf',
        args: [address!],
      });
      setHandle(enc as any);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onDecrypt = async () => {
    if (!instance || !address || !handle || !signerPromise) return;
    try {
      const signer = await signerPromise;
      const keypair = instance.generateKeypair();
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';
      const contractAddresses = [CUSDT_ADDRESS];

      // build EIP712 message with user's pubkey
      const eip712 = instance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays,
      );

      const signature = await signer.signTypedData(
        eip712.domain as any,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification } as any,
        eip712.message as any,
      );

      const results = await instance.userDecrypt(
        [
          { handle: handle as any, contractAddress: CUSDT_ADDRESS },
        ],
        keypair.privateKey,
        keypair.publicKey,
        signature,
        contractAddresses,
        address,
        startTimeStamp,
        durationDays,
      );

      const val = results[handle as any];
      if (val !== undefined) {
        const s = String(val);
        const len = s.length;
        const int = len > 6 ? s.slice(0, len - 6) : '0';
        const frac = (len > 6 ? s.slice(len - 6) : s.padStart(6, '0')).replace(/0+$/, '');
        setClear(frac ? `${int}.${frac}` : int);
      }
    } catch (e) {
      console.error(e);
      alert((e as any)?.message || 'Decrypt failed');
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
          💰
        </div>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#1f2937',
          marginTop: 0,
          marginBottom: '0.5rem'
        }}>
          Your Confidential Balance
        </h2>
        <p style={{
          color: '#6b7280',
          fontSize: '1rem',
          margin: 0
        }}>
          View and decrypt your private CUSDT balance
        </p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
        border: '1px solid #10b981',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button
              onClick={onFetch}
              disabled={!address || loading}
              style={{
                padding: '0.875rem 1.5rem',
                borderRadius: '12px',
                border: 'none',
                background: (!address || loading)
                  ? '#d1d5db'
                  : 'linear-gradient(135deg, #374151, #1f2937)',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: (!address || loading) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: (!address || loading) ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                if (!(!address || loading)) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 15px -3px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!(!address || loading)) {
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
              {loading ? 'Fetching...' : 'Fetch Balance'}
            </button>
          </div>

          {handle && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                alignItems: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    fontWeight: '600'
                  }}>
                    Encrypted Balance Handle
                  </span>
                  <code style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    background: '#f3f4f6',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    wordBreak: 'break-all',
                    textAlign: 'center'
                  }}>
                    {shortenHex(String(handle))}
                  </code>
                </div>

                <button
                  onClick={onDecrypt}
                  style={{
                    padding: '0.875rem 1.5rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #047857)',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 15px -3px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0px)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  🔓 Decrypt Balance
                </button>
              </div>
            </div>
          )}

          {clear && (
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              border: '2px solid #f59e0b',
              borderRadius: '16px',
              padding: '2rem',
              textAlign: 'center',
              boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                fontSize: '2.5rem',
                marginBottom: '1rem'
              }}>
                🎉
              </div>
              <div style={{
                fontSize: '1.125rem',
                color: '#374151',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Your Balance
              </div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: '#1f2937',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                {clear} <span style={{ fontSize: '1.5rem', color: '#6b7280' }}>CUSDT</span>
              </div>
            </div>
          )}

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
