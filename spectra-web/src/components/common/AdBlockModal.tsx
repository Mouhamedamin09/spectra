import React from 'react';
import { RefreshCw } from 'lucide-react';
import adblockLogo from '../../assets/Adblock_logo.png';

export const AdBlockModal: React.FC = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backdropFilter: 'blur(5px)'
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: '#18181b', // zinc-900
    border: '1px solid rgba(239, 68, 68, 0.3)', // red-500/30
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '450px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(127, 29, 29, 0.25)', // red-900/25
    color: 'white',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  const logoStyle: React.CSSProperties = {
    width: '80px',
    height: 'auto',
    marginBottom: '24px',
    display: 'block',
    margin: '0 auto 24px auto'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#ffffff'
  };

  const textStyle: React.CSSProperties = {
    color: '#a1a1aa', // zinc-400
    marginBottom: '32px',
    lineHeight: '1.6',
    fontSize: '16px'
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    padding: '16px',
    fontSize: '18px',
    backgroundColor: '#dc2626', // red-600
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontWeight: 600
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <img src={adblockLogo} alt="AdBlock Detected" style={logoStyle} />
        
        <h2 style={titleStyle}>Ad Blocker Detected</h2>
        
        <p style={textStyle}>
          We noticed you're using an ad blocker. Our service relies on ads to provide free content. 
          Please disable your ad blocker to continue watching.
        </p>
        
        <div>
          <button 
            style={buttonStyle}
            onClick={handleRefresh}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
          >
            <RefreshCw size={20} />
            I've Disabled It
          </button>
          
          <p style={{ fontSize: '12px', color: '#52525b', marginTop: '16px' }}>
            Refresh the page after disabling to continue
          </p>
        </div>
      </div>
    </div>
  );
};
