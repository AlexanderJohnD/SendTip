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
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>My cUSDT Balance</h2>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={onFetch} disabled={!address || loading}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #111827', background: '#111827', color: '#fff', cursor: 'pointer' }}>
          {loading ? 'Loading...' : 'Fetch' }
        </button>
      {handle && (
        <>
            <code style={{ fontSize: 12, color: '#6b7280' }}>{shortenHex(String(handle))}</code>
            <button onClick={onDecrypt}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #2563eb', background: '#2563eb', color: '#fff', cursor: 'pointer' }}>
              Decrypt
            </button>
          </>
        )}
      </div>
      {clear && (
        <div style={{ marginTop: 12, color: '#111827' }}>Balance: {clear} CUSDT</div>
      )}
    </div>
  );
}
