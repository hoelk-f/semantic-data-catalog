import React, { useState } from 'react';

const LoginIssuerModal = ({ onClose, onLogin }) => {
  const [customIssuer, setCustomIssuer] = useState('');

  const solidLogo = "/assets/images/solid.svg";

  return (
    <div className="modal show modal-show d-block" tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div className="modal-content shadow">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fa-solid fa-right-to-bracket mr-2"></i> Choose Solid Pod Provider
            </h5>
            <button type="button" className="close" onClick={onClose} aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div className="modal-body">
            <p className="mb-4">Please select a provider or enter your own Solid OIDC Issuer:</p>

            <div className="mb-3">
              <button
                className="btn btn-outline-primary w-100 d-flex align-items-center mb-2"
                onClick={() => onLogin('https://tmdt-solid-community-server.de')}
              >
                <img src={solidLogo} alt="solid" width="24" height="24" className="mr-2" />
                tmdt-solid-community-server.de
              </button>

              <button
                className="btn btn-outline-secondary w-100 d-flex align-items-center mb-2"
                onClick={() => onLogin('https://solidcommunity.net')}
              >
                <img src={solidLogo} alt="solid" width="24" height="24" className="mr-2" />
                solidcommunity.net
              </button>
            </div>

            <div className="form-group">
                <label htmlFor="customIssuer"><strong>Custom Issuer URL</strong></label>
                <div className="input-group">
                    <input
                        type="text"
                        id="customIssuer"
                        className="form-control"
                        value={customIssuer}
                        onChange={(e) => setCustomIssuer(e.target.value)}
                        placeholder="https://your-pod-provider.example"
                    />
                    <button
                        className="btn btn-outline-success btn-solid-login"
                        type="button"
                        onClick={() => onLogin(customIssuer)}
                        disabled={!customIssuer.trim()}
                    >
                    Login
                    </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginIssuerModal;