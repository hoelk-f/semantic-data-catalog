import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookOpen } from "@fortawesome/free-solid-svg-icons";
import { session } from "../solidSession";
import { standaloneCatalogBase } from "../standaloneRoutes";
import {
  getSolidDataset,
  getThing,
  getStringNoLocale,
  getUrl
} from "@inrupt/solid-client";
import { FOAF, VCARD } from "@inrupt/vocab-common-rdf";


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
  languageControl,
  initialUserInfo,
  profileLoading = false,
  onLogin,
}) => {
  const [userInfo, setUserInfo] = useState(initialUserInfo || {
    loggedIn: Boolean(session.info.isLoggedIn),
    name: '',
    email: '',
    photo: '',
    webId: ''
  });

  // Use a dedicated session instance for this app
  // (see ../solidSession.js)

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
    if (profileLoading) return;
    if (initialUserInfo?.webId === session.info.webId && initialUserInfo?.loggedIn) return;
    if (session.info.isLoggedIn && session.info.webId) {
      localStorage.setItem("solid-was-logged-in", "true");
      fetchPodUserInfo(session.info.webId);
    } else {
      // Anonymous browsing must never trigger an identity-provider redirect.
      if (onLoginStatusChange) onLoginStatusChange(false);

    }
  }, [profileLoading, initialUserInfo?.webId, initialUserInfo?.loggedIn]);

  const handleLogout = async () => {
    await session.logout({ logoutType: "app" });
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
    if (onWebIdChange) onWebIdChange(null);
    window.location.reload();
  };

  const displayedUser = session.info.isLoggedIn && initialUserInfo?.loggedIn && initialUserInfo.webId === session.info.webId ? initialUserInfo : userInfo;
  return (
    <div className="header-bar" data-standalone-header>
      <div className="header-left">
        <div className="header-title">
          <a data-standalone-brand href={standaloneCatalogBase(window.location.pathname) + '/'}>
            <FontAwesomeIcon icon={faBookOpen} className="header-icon" aria-hidden="true" />
            <span>Semantic <span className="highlight">Data</span> Catalog</span>
          </a>
        </div>
      </div>

      <div className="header-right header-right--catalog" data-standalone-actions>
        {displayedUser.loggedIn ? (
          <div className="header-user">
            {displayedUser.photo && (
              <img
                src={displayedUser.photo}
                alt="Profile"
                className="profile-picture"
              />
            )}
            <span className="header-user-name">
              <strong translate={displayedUser.name ? "no" : undefined}>{displayedUser.name || "Solid User"}</strong>{' '}
              <span className="header-user-webid">({displayedUser.webId})</span>
            </span>
            {languageControl}
            <button className="btn btn-light btn-sm header-logout" onClick={handleLogout}>
              <i className="fa-solid fa-right-from-bracket mr-1"></i> Logout
            </button>
          </div>
        ) : (
          <div className="catalog-header-guest">
            {languageControl}
            <button
              className="catalog-header-login"
              type="button"
              aria-label="Login"
              onClick={onLogin}
            >
              <i className="fa-solid fa-right-to-bracket mr-1"></i> Login
            </button>
          </div>
        )}
      </div>


    </div>
  );
};

export default HeaderBar;
