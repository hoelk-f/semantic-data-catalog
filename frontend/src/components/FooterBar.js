import React from 'react';

const FooterBar = () => {
  const rawLogos = process.env.REACT_APP_FOOTER_LOGOS;
  const logos = rawLogos
  ? rawLogos.split(",").map(l => l.trim()).filter(Boolean)
  : [];

  return (
    <footer className="footer-bar">
      <div className="footer-logo-group">
        <img src="/assets/images/Logo_BUW.png" alt="Logo BUW" className="logo-small" />
        <img src="/assets/images/Logo_TMDT.png" alt="Logo TMDT" className="logo-medium" />
        {logos.map((src, index) => (
          <img key={index} src={src} alt={`Logo ${index}`} className="logo-small" />
        ))}
      </div>

      <div className="footer-version">
        Semantic Data Catalog {process.env.REACT_APP_VERSION || "dev"}
      </div>
    </footer>
  );
};

export default FooterBar;
