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
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>Register GitHub</h2>
      <div style={{ display: 'flex', gap: 12 }}>
        <input
          placeholder="github username"
          value={github}
          onChange={(e) => setGithub(e.target.value)}
          style={{ flex: 1, padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}
        />
        <button disabled={!address || submitting || !github}
          onClick={onRegister}
          style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid #2563eb', background: '#2563eb', color: '#fff', cursor: 'pointer' }}>
          {submitting ? 'Submitting...' : 'Register'}
        </button>
      </div>
    </div>
  );
}
