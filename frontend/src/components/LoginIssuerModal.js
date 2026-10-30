import React, { useState } from 'react';
import CatalogModal from './CatalogModal';
import LoginScreen from './LoginScreen';
import { useI18n } from '../i18n';
import './CatalogLogin.css';

export default function LoginIssuerModal({ onClose, onLogin, LoginScreenComponent }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const Screen = LoginScreenComponent || LoginScreen;
  const login = async issuer => {
    if (busy) return;
    setBusy(true); setError('');
    try { await onLogin(issuer); }
    catch { setError('Login could not be started. Please try again.'); setBusy(false); }
  };
  return <CatalogModal label={t('Login')} className="catalog-login-dialog" onClose={onClose}>
    <button type="button" className="catalog-icon-button catalog-login-close" aria-label={t('Close')} onClick={onClose}>×</button>
    <div aria-busy={busy}>
      <fieldset disabled={busy}>
        <Screen onLogin={login} defaultIssuer={process.env.REACT_APP_OIDC_ISSUER || 'https://solid-community-server.tmdt.info'} />
      </fieldset>
      {error && <p role="alert" className="catalog-login-error">{t(error)}</p>}
    </div>
  </CatalogModal>;
}
