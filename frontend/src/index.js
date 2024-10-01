import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
  return null;
};

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
} else {
    console.error("Root container not found");
}