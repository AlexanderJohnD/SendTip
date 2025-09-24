import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header() {
  return (
    <header style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: 'clamp(0.75rem, 2vw, 1rem)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(0.5rem, 2vw, 1rem)',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: 'clamp(32px, 5vw, 40px)',
              height: 'clamp(32px, 5vw, 40px)',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(1rem, 2vw, 1.25rem)'
            }}>
              💸
            </div>
            <strong style={{
              fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
              fontWeight: '700',
              color: 'white',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              whiteSpace: 'nowrap'
            }}>
              SendTip
            </strong>
          </div>
          <span style={{
            fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
            color: 'rgba(255, 255, 255, 0.8)',
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap'
          }}>
            🔒 Confidential
          </span>
        </div>
        <div style={{
          filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
        }}>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
