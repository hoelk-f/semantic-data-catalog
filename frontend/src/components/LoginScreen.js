import LoginParticleCloud from "../standalone/LoginParticleCloud";
import React, { useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";

const providers = [
  { label: 'TMDT Solid', url: 'https://solid-community-server.tmdt.info', note: 'Recommended' },
  { label: 'Solid Community', url: 'https://solidcommunity.net', note: 'Public community server' },
];

const LoginScreen = ({ onLogin, defaultIssuer, languageControl = null }) => {
  const [selected, setSelected] = useState(defaultIssuer || providers[0].url);
  const [customIssuer, setCustomIssuer] = useState('');
  const useCustom = customIssuer.trim().length > 0;
  const issuerToLogin = useCustom ? customIssuer.trim() : selected;

  return (
    <div className="login-screen" data-standalone-login>
      <div className="login-wrap" data-standalone-login-card>
        <div className="login-hero" data-standalone-login-heading>
          <div className="login-hero-left">
            <div className="login-hero-icon">
              <FontAwesomeIcon icon={faBookOpen} />
            </div>
            <div>
              <div className="login-hero-title">Semantic Data Catalog</div>
            </div>
          </div>
        </div>

        <LoginParticleCloud label="Semantic Data Catalog" />

        <div className="login-card" data-standalone-login-form>
          <div className="login-section">
            <div className="section-head">
              <span className="section-title">Suggested providers</span>
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
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="login-section">
            <div className="section-head">
              <span className="section-title">Custom issuer</span>
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

          <div className="login-footer" data-standalone-login-actions>
            {languageControl}
            <button
              type="button"
              className="login-primary"
              onClick={() => onLogin(issuerToLogin)}
              disabled={!issuerToLogin}
              title="Log in with selected provider"
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
              <span>Login</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
