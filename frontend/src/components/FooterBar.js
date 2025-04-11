import React from 'react';

const FooterBar = () => {
  return (
    <footer
      style={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        height: '70px',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 40px',
        zIndex: 999,
      }}
    >
      {/* Zentrierte Logos */}
      <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
        <img src="/assets/images/BUW_Logo.png" alt="Logo BUW" style={{ height: '50px' }} />
        <img src="/assets/images/TMDT_Logo_small.png" alt="Logo TMDT" style={{ height: '60px' }} />
        <img src="/assets/images/Logo_GesundesTal_RGB.png" alt="Logo Wuppertal" style={{ height: '50px' }} />
        <img src="/assets/images/Icon_GesundesTal_RGB.png" alt="Logo GesundesTal" style={{ height: '60px' }} />
      </div>

      {/* Rechts: Text */}
      <div style={{
        position: 'absolute',
        right: '20px',
        fontSize: '16px',
        fontWeight: 500,
      }}>
        Semantic Data Catalog 0.8.4
      </div>
    </footer>
  );
};

export default FooterBar;
