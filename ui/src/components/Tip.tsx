import { useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { Contract } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CUSDT_ADDRESS, SENDTIP_ADDRESS } from '../config/contracts';
import CUSDTAbi from '../abi/CUSDT.json';
import SendTipAbi from '../abi/SendTip.json';

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
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>Send CUSDT Tip</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          placeholder="recipient github"
          value={github}
          onChange={(e) => setGithub(e.target.value)}
          style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}
        />
        <input
          placeholder="amount (6 decimals)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}
        />
        <button disabled={!address || !instance || submitting}
          onClick={onSend}
          style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid #2563eb', background: '#2563eb', color: '#fff', cursor: 'pointer', alignSelf: 'flex-start' }}>
          {submitting ? 'Sending...' : 'Send Tip'}
        </button>
      </div>
    </div>
  );
}
