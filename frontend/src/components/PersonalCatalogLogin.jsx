import React from 'react';
import { useI18n } from '../i18n';

export default function PersonalCatalogLogin({ onLogin }) {
  const { t } = useI18n();
  return <section className="personal-catalog-login">
    <div className="personal-catalog-login-icon"><i className="fa-solid fa-user-lock" aria-hidden="true" /></div>
    <h1>{t('Personal catalog')}</h1>
    <p>{t('Sign in to browse the entries in your own Pod catalog.')}</p>
    <button className="catalog-header-login" type="button" onClick={onLogin}>{t('Login')}</button>
  </section>;
}
