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

const HeaderBar = ({ onLoginStatusChange, onWebIdChange, onUserInfoChange, activeTab, setActiveTab }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userInfo, setUserInfo] = useState({
    loggedIn: false,
    name: '',
    email: '',
    photo: '',
    webId: ''
  });

  // Use a dedicated session instance for this app
  // (see ../solidSession.js)

  const loginWithIssuer = (issuer) => {
    session.login({
      oidcIssuer: issuer,
      redirectUrl: window.location.href,
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
        photo,
        webId
      });

      if (onLoginStatusChange) onLoginStatusChange(true);
      if (onWebIdChange) onWebIdChange(webId);
      if (onUserInfoChange) onUserInfoChange({ name, email });

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
      photo: '',
      webId: ''
    });
    if (onLoginStatusChange) onLoginStatusChange(false);
    if (onUserInfoChange) onUserInfoChange({ name: '', email: '' });
    session.logout({ logoutRedirectUrl: window.location.href });
    window.location.reload();
  };

  return (
    <div className="header-bar">
      <div className="header-left">
        <div className="header-title">
          <a href={process.env.PUBLIC_URL + '/'}>
            <i className="fa-solid fa-book-open header-icon" aria-hidden="true"></i>
            <span>Semantic <span className="highlight">Data</span> Catalog</span>
          </a>
        </div>
      </div>

      {userInfo.loggedIn ? (
        <div className="header-user">
          {userInfo.photo && (
            <img
              src={userInfo.photo}
              alt="Profile"
              className="profile-picture"
            />
          )}
          <span className="header-user-name">
            <strong>{userInfo.name || "Solid User"}</strong>{' '}
            <span className="header-user-webid">({userInfo.webId})</span>
          </span>
          <button className="btn btn-light btn-sm header-logout" onClick={handleLogout}>
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
