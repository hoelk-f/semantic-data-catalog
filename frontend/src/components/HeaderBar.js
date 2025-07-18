import React, { useEffect, useState } from 'react';
import {
  getDefaultSession,
  handleIncomingRedirect,
  login,
  logout
} from "@inrupt/solid-client-authn-browser";
import {
  getSolidDataset,
  getThing,
  getStringNoLocale,
  getUrl
} from "@inrupt/solid-client";
import { FOAF, VCARD } from "@inrupt/vocab-common-rdf";
import LoginIssuerModal from './LoginIssuerModal';

const HeaderBar = ({ onLoginStatusChange, onWebIdChange, activeTab, setActiveTab }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [customIssuer, setCustomIssuer] = useState('');
  const [userInfo, setUserInfo] = useState({
    loggedIn: false,
    name: '',
    email: '',
    photo: ''
  });

  const session = getDefaultSession();

  const loginWithIssuer = (issuer) => {
    login({
      oidcIssuer: issuer,
      redirectUrl: process.env.REACT_APP_REDIRECT_URL,
      clientName: "Semantic Data Catalog",
    });
  };

  const fetchPodUserInfo = async (webId) => {
    try {
      const dataset = await getSolidDataset(webId, { fetch: session.fetch });
      const profile = getThing(dataset, webId);

      const name = getStringNoLocale(profile, FOAF.name) ||
                   getStringNoLocale(profile, VCARD.fn) || "Solid User";
      const photo = getUrl(profile, VCARD.hasPhoto) || '';

      let email = "";
      const emailNode = getUrl(profile, VCARD.hasEmail);
      if (emailNode) {
        const emailThing = getThing(dataset, emailNode);
        if (emailThing) {
          const mailto = getUrl(emailThing, VCARD.value);
          if (mailto && mailto.startsWith("mailto:")) {
            email = mailto.replace("mailto:", "");
          }
        }
      }

      setUserInfo({
        loggedIn: true,
        name,
        email,
        photo
      });

      if (onLoginStatusChange) onLoginStatusChange(true);
      if (onWebIdChange) onWebIdChange(webId);

    } catch (err) {
      console.error("Error loading pod profile info:", err);
    }
  };

  useEffect(() => {
    handleIncomingRedirect({ restorePreviousSession: true }).then(() => {
      if (session.info.isLoggedIn && session.info.webId) {
        localStorage.setItem("solid-was-logged-in", "true");
        fetchPodUserInfo(session.info.webId);
      } else {
        const wasLoggedIn = localStorage.getItem("solid-was-logged-in") === "true";
        if (wasLoggedIn) {
          const lastIssuer = localStorage.getItem("solid-oidc-issuer") || process.env.REACT_APP_OIDC_ISSUER;
          loginWithIssuer(lastIssuer);
        }
        else {
          if (onLoginStatusChange) onLoginStatusChange(false);
        }
      }
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("solid-was-logged-in");
    setUserInfo({
      loggedIn: false,
      name: '',
      email: '',
      photo: ''
    });
    if (onLoginStatusChange) onLoginStatusChange(false);
    logout({ logoutRedirectUrl: window.location.href });
    window.location.reload();
  };

  return (
    <div className="header-bar">
      <div className="d-flex align-items-center">
        <div className="header-title">
          <a href="/">
            Semantic <span className="highlight">Data</span> Catalog
          </a>
        </div>

        <div className="header-tabs">
          {[
            { key: 'dataset', label: 'Dataset' },
            { key: 'collection', label: 'Dataset Series' },
            { key: 'services', label: 'Services' },
          ].map(({ key, label }) => (
            <a
              key={key}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(key);
              }}
              className={`tab-link ${activeTab === key ? 'active' : ''}`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {userInfo.loggedIn ? (
        <div className="d-flex align-items-center">
          {userInfo.photo && (
            <img
              src={userInfo.photo}
              alt="Profile"
              className="profile-picture"
            />
          )}
          <span className="mr-3">
            <strong>{userInfo.name}</strong>{' '}
            <span className="ml-1">({userInfo.email})</span>
          </span>
          <button className="btn btn-light btn-sm" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket mr-1"></i> Logout
          </button>
        </div>
      ) : (
        <div className="d-flex align-items-center">
          <span className="mr-3"><strong>Not logged in</strong></span>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => setShowLoginModal(true)}
          >
            <i className="fa-solid fa-right-to-bracket mr-1"></i> Login with Solid
          </button>
        </div>
      )}

      {showLoginModal && (
        <LoginIssuerModal
          onClose={() => setShowLoginModal(false)}
          onLogin={(issuer) => {
            setShowLoginModal(false);
            localStorage.setItem("solid-oidc-issuer", issuer);
            loginWithIssuer(issuer);
          }}
        />
      )}
    </div>
  );
};

export default HeaderBar;
