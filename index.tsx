import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Der Zugriffsschutz erfolgt nun serverseitig über die index.php (siehe vite.config.ts).
// Clientseitige Checks sind nicht mehr notwendig und wurden entfernt.

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);