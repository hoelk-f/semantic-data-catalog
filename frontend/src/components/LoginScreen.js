import React, { useState } from 'react';

const providers = [
  { label: 'TMDT Solid', url: 'https://tmdt-solid-community-server.de', note: 'Recommended' },
  { label: 'Solid Community', url: 'https://solidcommunity.net', note: 'Public community server' },
];

const LoginScreen = ({ onLogin, defaultIssuer }) => {
  const [selected, setSelected] = useState(defaultIssuer || providers[0].url);
  const [customIssuer, setCustomIssuer] = useState('');
  const useCustom = customIssuer.trim().length > 0;
  const issuerToLogin = useCustom ? customIssuer.trim() : selected;

  return (
    <div className="login-wrap">
      <div className="login-hero">
        <div className="login-hero-left">
          <div>
            <div className="login-hero-title">
              <i className="fa-solid fa-book-open" aria-hidden="true" />
              Semantic Data Catalog
            </div>
            <div className="login-hero-sub">Choose your Solid Pod provider</div>
          </div>
        </div>
      </div>
      <div className="login-card">
        <div className="login-section">
          <div className="provider-guide">
            <div className="provider-guide-head">
              <span className="guide-title">No Solid Pod yet?</span>
              <span className="guide-sub">
                Example using the <strong>TMDT Solid Server</strong>
              </span>
            </div>
            <div className="guide-steps">
              <div className="guide-step">
                <span className="step-num">1</span>
                <p>
                  Visit{' '}
                  <a href="https://tmdt-solid-community-server.de" target="_blank" rel="noreferrer">
                    tmdt-solid-community-server.de
                  </a>{' '}
                  or any other Solid Pod Provider.
                </p>
              </div>
              <div className="guide-step">
                <span className="step-num">2</span>
                <p>
                  Click <strong>Register</strong> to create your account.
                </p>
              </div>
              <div className="guide-step">
                <span className="step-num">3</span>
                <p>Log in and choose a name to create your Pod.</p>
              </div>
              <div className="guide-step">
                <span className="step-num">4</span>
                <p>Come back here, pick the provider and sign in with your new Pod.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="login-section">
          <div className="section-head">
            <span className="section-title">Suggested providers</span>
            <span className="section-hint">Pick a card or use "Custom issuer" below</span>
          </div>
          <div className="provider-grid">
            {providers.map((provider) => {
              const isActive = selected === provider.url && !useCustom;
              return (
                <button
                  key={provider.url}
                  type="button"
                  className={`prov-card${isActive ? ' active' : ''}`}
                  onClick={() => {
                    setSelected(provider.url);
                    setCustomIssuer('');
                  }}
                  title={provider.url}
                >
                  <span className={`radio${isActive ? ' on' : ''}`} aria-hidden="true" />
                  <div className="prov-text">
                    <div className="prov-label">{provider.label}</div>
                    <div className="prov-url">{provider.url}</div>
                    <div className="prov-note">{provider.note}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="login-section">
          <div className="section-head">
            <span className="section-title">Custom issuer</span>
            <span className="section-hint">OIDC issuer URL of your Pod provider</span>
          </div>
          <div className="custom-row">
            <input
              className="custom-input"
              placeholder="https://your-pod-provider.example"
              value={customIssuer}
              onChange={(event) => setCustomIssuer(event.target.value)}
            />
            {useCustom && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => setCustomIssuer('')}
                title="Back to provider list"
              >
                x
              </button>
            )}
          </div>
        </div>

        <div className="login-footer">
          <div className="login-meta">
            <span className="dot" /> Solid OIDC Login
          </div>
          <button
            className="login-primary"
            onClick={() => onLogin(issuerToLogin)}
            disabled={!issuerToLogin}
            title="Log in with selected provider"
          >
            <i className="fa-solid fa-right-to-bracket" aria-hidden="true" />
            <span>Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
