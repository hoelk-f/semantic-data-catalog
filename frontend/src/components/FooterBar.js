import React from 'react';
import { appVersion } from '../version';

const FooterBar = () => {
  return (
    <footer className="footer-bar">
      <div className="footer-logo-group">
        <img
          src={process.env.PUBLIC_URL + '/assets/images/Logo_BUW.png'}
          alt="Logo BUW"
          className="logo-small"
        />
        <img
          src={process.env.PUBLIC_URL + '/assets/images/Logo_TMDT.png'}
          alt="Logo TMDT"
          className="logo-medium"
        />
      </div>

      <div className="footer-version">Semantic Data Catalog {appVersion}</div>
    </footer>
  );
};

export default FooterBar;
