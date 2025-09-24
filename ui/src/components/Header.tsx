import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header() {
  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong>SendTip</strong>
          <span style={{ fontSize: 12, color: '#374151', border: '1px solid #d1d5db', padding: '2px 6px', borderRadius: 999 }}>Confidential</span>
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}
