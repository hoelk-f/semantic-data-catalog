import React, { useEffect, useState } from 'react';
import { getDefaultSession, handleIncomingRedirect, login, logout } from "@inrupt/solid-client-authn-browser";
import { getSolidDataset, getThing, getStringNoLocale, getUrl } from "@inrupt/solid-client";
import { FOAF, VCARD } from "@inrupt/vocab-common-rdf";

const HeaderBar = ({ onLoginStatusChange, onWebIdChange, activeTab, setActiveTab }) => {
    const [userInfo, setUserInfo] = useState({
        loggedIn: false,
        name: '',
        email: '',
        photo: ''
    });

    const session = getDefaultSession();

    const fetchPodUserInfo = async (webId) => {
        try {
            const dataset = await getSolidDataset(webId, { fetch: session.fetch });
            const profile = getThing(dataset, webId);

            const name = getStringNoLocale(profile, FOAF.name) || getStringNoLocale(profile, VCARD.fn) || "Solid User";
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
                    login({
                        oidcIssuer: "https://solidcommunity.net",
                        redirectUrl: window.location.href,
                        clientName: "Semantic Data Catalog",
                    });
                } else {
                    if (onLoginStatusChange) onLoginStatusChange(false);
                }
            }
        });
    }, []);

    const handleLogin = () => {
        login({
            oidcIssuer: "https://solidcommunity.net",
            redirectUrl: window.location.href,
            clientName: "Semantic Data Catalog",
        });
    };

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
        <div
          style={{
            width: '100%',
            backgroundColor: '#f4f4f4',
            padding: '20px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '16px',
            borderBottom: '1px solid #ccc',
            minHeight: '80px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              fontWeight: 'bold',
              fontSize: '28px',
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
            }}>
              <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                Semantic <span style={{ color: '#FFA500' }}>Data</span> Catalog
              </a>
            </div>
      
            <div style={{ display: 'flex', gap: '10px', marginLeft: '16px' }}>
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
                style={{
                  padding: '6px 12px',
                  textDecoration: 'none',
                  fontWeight: activeTab === key ? 'bold' : 'normal',
                  borderBottom: activeTab === key ? '2px solid #FFA500' : '2px solid transparent',
                  color: activeTab === key ? '#000' : '#666',
                  transition: 'all 0.2s ease-in-out',
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#000';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = activeTab === key ? '#000' : '#666';
                }}
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
                  className="rounded-circle"
                  style={{ width: '32px', height: '32px', objectFit: 'cover', marginRight: '12px' }}
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
              <button className="btn btn-outline-primary btn-sm" onClick={handleLogin}>
                <i className="fa-solid fa-right-to-bracket mr-1"></i> Login with Solid
              </button>
            </div>
          )}
        </div>
      );
      
};

export default HeaderBar;
