import React, { useEffect, useState } from 'react';
import {
  login,
  logout,
  handleIncomingRedirect,
  getDefaultSession,
} from "@inrupt/solid-client-authn-browser";
import {
  getSolidDataset,
  getThing,
  getStringNoLocale
} from "@inrupt/solid-client";
import { 
  FOAF, 
  VCARD 
} from "@inrupt/vocab-common-rdf";

const SolidPodConnectionModal = ({ onClose }) => {
  const [customProvider, setCustomProvider] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [webId, setWebId] = useState('');
  const [userName, setUserName] = useState('');

  const COMMON_PROVIDERS = [
    { name: "Inrupt", url: "https://broker.pod.inrupt.com" },
    { name: "Solidcommunity.net", url: "https://solidcommunity.net" },
    { name: "Solidweb.org", url: "https://solidweb.org" },
  ];

  useEffect(() => {
    handleIncomingRedirect({ restorePreviousSession: true }).then(() => {
      const session = getDefaultSession();
      if (session.info.isLoggedIn) {
        setIsLoggedIn(true);
        setWebId(session.info.webId);
        if (session.info.webId) {
          fetchProfileName(session.info.webId);
        }
      }
    });
  }, []);

  const fetchProfileName = async (webId) => {
    try {
      const dataset = await getSolidDataset(webId);
      const profile = getThing(dataset, webId);
      let name = profile && getStringNoLocale(profile, FOAF.name);
      if (!name) {
        name = profile && getStringNoLocale(profile, VCARD.fn);
      }
      if (name) {
        setUserName(name);
      }
    } catch (error) {
      console.warn("Could not fetch profile name:", error);
    }
  };

  const handleLogin = () => {
    const provider = customProvider || selectedProvider;
    if (!provider) return alert("Please select or enter a Solid Pod provider.");
    login({
      redirectUrl: window.location.href,
      oidcIssuer: provider,
      clientName: "Semantic Data Catalog",
    });
  };

  const handleLogout = async () => {
    await logout();
    setIsLoggedIn(false);
    setWebId('');
    setUserName('');
  };

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Connect Your Solid Pod</h5>
            <button type="button" className="close" onClick={onClose} aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div className="modal-body">
            {isLoggedIn ? (
              <>
                <h6 className="mb-3">
                  Welcome back{userName ? `, ${userName}` : ''} 
                </h6>
                <div className="alert alert-success">
                  Logged in as <code>{webId}</code>
                </div>
                <button className="btn btn-danger mt-3" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Select Common Solid Pod Provider</label>
                  <select
                    className="form-control"
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                  >
                    <option value="">-- Choose a provider --</option>
                    {COMMON_PROVIDERS.map((provider) => (
                      <option key={provider.url} value={provider.url}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Or Enter Custom Solid Pod Provider URL</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="https://your-pod-provider.com"
                    value={customProvider}
                    onChange={(e) => setCustomProvider(e.target.value)}
                  />
                </div>

                <button className="btn btn-primary" onClick={handleLogin}>
                  Login to Solid Pod
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolidPodConnectionModal;
