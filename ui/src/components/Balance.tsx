import { useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { CUSDT_ADDRESS } from '../config/contracts';
import CUSDTAbi from '../abi/CUSDT.json';

export function Balance() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { instance } = useZamaInstance();
  const [handle, setHandle] = useState<string>('');
  const [clear, setClear] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const onFetch = async () => {
    if (!address) return;
    setLoading(true);
    try {
      // read encrypted balance handle (bytes32) for caller
      const enc = await publicClient!.readContract({
        address: CUSDT_ADDRESS as `0x${string}`,
        abi: CUSDTAbi as any,
        functionName: 'getBalance',
        args: [],
      });
      setHandle(enc as any);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onDecrypt = async () => {
    if (!instance || !address || !handle) return;
    try {
      const keypair = instance.generateKeypair();
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';
      const contractAddresses = [CUSDT_ADDRESS];

      const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, startTimeStamp, durationDays);

      // let wallet handle user signature via walletconnect; using viem signer is out of scope here
      // The relayer SDK can also use connected wallet through ethers if desired

      // In this template, we expect the instance to manage request using the wallet via injected provider
      const result = await instance.userDecrypt(
        [
          {
            handle: handle,
            contractAddress: CUSDT_ADDRESS,
          },
        ],
        keypair.secretKey,
      );

      if (result && result.length > 0) {
        // result returns BigInt-like decimal string
        const v = result[0];
        // format with 6 decimals
        const s = v.toString();
        const len = s.length;
        const int = len > 6 ? s.slice(0, len - 6) : '0';
        const frac = (len > 6 ? s.slice(len - 6) : s.padStart(6, '0')).replace(/0+$/, '');
        setClear(frac ? `${int}.${frac}` : int);
      }
    } catch (e) {
      console.error(e);
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
            <code style={{ fontSize: 12, color: '#6b7280' }}>{String(handle)}</code>
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

