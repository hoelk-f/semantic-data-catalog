import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { restoreSession } from './solidSession';

const rootElement = document.getElementById('root');

// Ensure the Solid session is restored before rendering the application so
// that components relying on authentication have the correct state on load.
restoreSession().finally(() => {
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
  } else {
    console.error("Root container not found");
  }
});
