import React, { useEffect, useState } from 'react';
import { session } from "../solidSession";
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
  const [userInfo, setUserInfo] = useState({
    loggedIn: false,
    name: '',
    email: '',
    photo: ''
  });

  // Use a dedicated session instance for this app
  // (see ../solidSession.js)

  const getRedirectUrl = () => {
    if (window._env_ && window._env_.REACT_APP_REDIRECT_URL) {
      return window._env_.REACT_APP_REDIRECT_URL;
    }
    if (process.env.REACT_APP_REDIRECT_URL) {
      return process.env.REACT_APP_REDIRECT_URL;
    }
    return `${window.location.origin}${process.env.PUBLIC_URL || ''}/`;
  };

  const loginWithIssuer = (issuer) => {
    session.login({
      oidcIssuer: issuer,
      redirectUrl: getRedirectUrl(),
      clientName: "Semantic Data Catalog",
    });
  };

  const fetchPodUserInfo = async (webId) => {
    try {
      const dataset = await getSolidDataset(webId, { fetch: session.fetch });
      const profile = getThing(dataset, webId);

      const name = getStringNoLocale(profile, FOAF.name) ||
                   getStringNoLocale(profile, VCARD.fn) || "Solid User";

      const photoRef = getUrl(profile, VCARD.hasPhoto) || getUrl(profile, FOAF.img);
      let photo = '';
      if (photoRef) {
        let photoUrl = photoRef;
        if (!/\.(png|jpe?g|gif|svg|webp)$/i.test(photoRef)) {
          const photoThing = getThing(dataset, photoRef);
          if (photoThing) {
            photoUrl = getUrl(photoThing, VCARD.value) || getUrl(photoThing, VCARD.url) || '';
          }
        }

        if (photoUrl) {
          try {
            const response = await session.fetch(photoUrl);
            if (response.ok) {
              const blob = await response.blob();
              photoUrl = URL.createObjectURL(blob);
            }
          } catch (e) {
            // Ignore fetch errors and fall back to the original URL
          }
          photo = photoUrl;
        }
      }

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
    if (session.info.isLoggedIn && session.info.webId) {
      localStorage.setItem("solid-was-logged-in", "true");
      fetchPodUserInfo(session.info.webId);
    } else {
      const wasLoggedIn = localStorage.getItem("solid-was-logged-in") === "true";
      if (wasLoggedIn) {
        const lastIssuer =
          localStorage.getItem("solid-oidc-issuer") || process.env.REACT_APP_OIDC_ISSUER;
        loginWithIssuer(lastIssuer);
      } else {
        if (onLoginStatusChange) onLoginStatusChange(false);
      }
    }
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
    session.logout({ logoutRedirectUrl: window.location.href });
    window.location.reload();
  };

  return (
    <div className="header-bar">
      <div className="d-flex align-items-center">
        <div className="header-title">
          <a href={process.env.PUBLIC_URL + '/'}>
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
