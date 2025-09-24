import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CUSDT_ADDRESS } from '../config/contracts';
import CUSDTAbi from '../abi/CUSDT.json';
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
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>Faucet: Mint cUSDT</h2>
      <div style={{ display: 'flex', gap: 12 }}>
        <input
          placeholder="Amount (6 decimals)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ flex: 1, padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}
        />
        <button onClick={onMint} disabled={!address || loading}
          style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid #2563eb', background: '#2563eb', color: '#fff', cursor: 'pointer' }}>
          {loading ? 'Minting...' : 'Mint'}
        </button>
      </div>
    </div>
  );
}

