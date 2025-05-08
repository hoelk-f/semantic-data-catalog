import React from 'react';

const FooterBar = () => {
  const rawLogos = process.env.REACT_APP_FOOTER_LOGOS;
  const logos = rawLogos
  ? rawLogos.split(",").map(l => l.trim()).filter(Boolean)
  : [];

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
        <img src="/assets/images/Logo_BUW.png" alt="Logo BUW" style={{ height: '50px' }} />
        <img src="/assets/images/Logo_TMDT.png" alt="Logo TMDT" style={{ height: '60px' }} />
        {logos.map((src, index) => (
          <img key={index} src={src} alt={`Logo ${index}`} style={{ height: '50px' }} />
        ))}
      </div>

      {/* Rechts: Text */}
      <div style={{
        position: 'absolute',
        right: '20px',
        fontSize: '16px',
        fontWeight: 500,
      }}>
        Semantic Data Catalog {process.env.REACT_APP_VERSION || "dev"}
      </div>
    </footer>
  );
};

export default FooterBar;
