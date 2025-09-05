import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { restoreSession } from './solidSession';

const rootElement = document.getElementById('root');

// Ensure the Solid session is restored before rendering the application so
// that components relying on authentication have the correct state on load.
restoreSession().finally(() => {
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <App />
      </BrowserRouter>
    );
  } else {
    console.error("Root container not found");
  }
});
