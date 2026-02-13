import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// --- TÜRSTEHER-CODE (SECURITY CHECK) ---
// Wir prüfen zwei Dinge:
// 1. Läuft die App lokal? (Entwicklungsumgebung) -> Erlauben
// 2. Läuft die App in einem iFrame? (itslearning) -> Erlauben
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isInIframe = window.self !== window.top;

// Wenn NICHT lokal und NICHT im iFrame -> Blockieren
if (!isLocalhost && !isInIframe) {
  // Zugriff verweigern: Wir rendern eine neutrale Fehlerseite direkt in das Root-Element
  // ohne die React-App zu starten.
  rootElement.innerHTML = `
    <div style="height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; background-color: #f3f4f6; color: #6b7280;">
      <div style="text-align: center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 16px auto; opacity: 0.5;">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <h1 style="margin: 0; font-size: 1.25rem; font-weight: 600;">Zugriff verweigert</h1>
        <p style="margin-top: 8px; font-size: 0.875rem;">Diese Anwendung ist nur über das interne Schulportal verfügbar.</p>
      </div>
    </div>
  `;
} else {
  // Zugriff erlaubt: React-App starten
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}