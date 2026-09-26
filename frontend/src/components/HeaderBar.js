import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookOpen } from "@fortawesome/free-solid-svg-icons";
import { session } from "../solidSession";
import {
  getSolidDataset,
  getThing,
  getStringNoLocale,
  getUrl
} from "@inrupt/solid-client";
import { FOAF, VCARD } from "@inrupt/vocab-common-rdf";
import LoginIssuerModal from './LoginIssuerModal';

export const loadProfilePhoto = async (dataset, profile, fetch) => {
  const photoRef = getUrl(profile, VCARD.hasPhoto) || getUrl(profile, FOAF.img);
  if (!photoRef) return '';
  let photoUrl = photoRef;
  if (!/\.(png|jpe?g|gif|svg|webp)$/i.test(photoRef)) {
    const photoThing = getThing(dataset, photoRef);
    if (photoThing) {
      photoUrl = getUrl(photoThing, VCARD.value) || getUrl(photoThing, VCARD.url) || '';
    }
  }
  if (photoUrl) {
    try {
      const response = await fetch(photoUrl);
      if (response.ok) return URL.createObjectURL(await response.blob());
    } catch {
      // A missing avatar does not prevent access to the catalog.
    }
  }
  return photoUrl;
};

const HeaderBar = ({
  onLoginStatusChange,
  onWebIdChange,
  onUserInfoChange,
  activeTab,
  setActiveTab,
  languageControl,
  initialUserInfo,
}) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userInfo, setUserInfo] = useState(initialUserInfo || {
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

      const photo = await loadProfilePhoto(dataset, profile, session.fetch);

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
    if (initialUserInfo?.webId === session.info.webId && initialUserInfo?.loggedIn) return;
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
            <FontAwesomeIcon icon={faBookOpen} className="header-icon" aria-hidden="true" />
            <span>Semantic <span className="highlight">Data</span> Catalog</span>
          </a>
        </div>
      </div>

      <div className="header-right header-right--catalog">
        {userInfo.loggedIn && <button type="button" className="btn btn-light"
          onClick={() => setActiveTab(activeTab === 'semantic-search' ? 'dataset' : 'semantic-search')}>
          {activeTab === 'semantic-search' ? 'Semantic Data Catalog' : 'Semantic Search'}
        </button>}
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
              <strong translate={userInfo.name ? "no" : undefined}>{userInfo.name || "Solid User"}</strong>{' '}
              <span className="header-user-webid">({userInfo.webId})</span>
            </span>
            {languageControl}
            <button className="btn btn-light btn-sm header-logout" onClick={handleLogout}>
              <i className="fa-solid fa-right-from-bracket mr-1"></i> Logout
            </button>
          </div>
        ) : (
          <div className="d-flex align-items-center">
            {languageControl}
            <span className="mr-3"><strong>Not logged in</strong></span>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => setShowLoginModal(true)}
            >
              <i className="fa-solid fa-right-to-bracket mr-1"></i> Login with Solid
            </button>
          </div>
        )}
      </div>

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
