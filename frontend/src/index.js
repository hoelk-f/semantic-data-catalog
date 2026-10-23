import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import LoginScreen from './components/LoginScreen';
import { restoreSession } from './solidSession';
import { standaloneCatalogBase } from './standaloneRoutes';
import { markSafariBrowser } from './safariDetection';
import './LoginScreen.css';


import "./standalone/shell.css";
import "./standalone/layout.css";
document.body.classList.add("dataspace-standalone");

markSafariBrowser();

const rootElement = document.getElementById('root');

// Ensure the Solid session is restored before rendering the application so
// that components relying on authentication have the correct state on load.
restoreSession().finally(() => {
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <BrowserRouter
        basename={standaloneCatalogBase(window.location.pathname)}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <App LoginScreenComponent={LoginScreen} />
      </BrowserRouter>
    );
  } else {
    console.error("Root container not found");
  }
});
