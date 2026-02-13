import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as fs from 'fs';
import * as path from 'path';

// 1. Plugin: Kopiert die Backend-API
const copyApiPlugin = () => ({
  name: 'copy-api-php',
  closeBundle: () => {
    try {
      const rootDir = path.resolve('.');
      const srcPath = path.resolve(rootDir, 'api.php');
      const distPath = path.resolve(rootDir, 'dist');
      const destPath = path.resolve(distPath, 'api.php');

      if (fs.existsSync(srcPath)) {
        if (!fs.existsSync(distPath)) {
            fs.mkdirSync(distPath, { recursive: true });
        }
        fs.copyFileSync(srcPath, destPath);
        console.log('\x1b[32m%s\x1b[0m', '✅ api.php wurde erfolgreich in den dist-Ordner kopiert.');
      } else {
        console.warn('⚠️ api.php nicht im Stammverzeichnis gefunden.');
      }
    } catch (error) {
      console.error('Fehler beim Kopieren der api.php:', error);
    }
  }
});

// 2. Plugin: Wandelt index.html in index.php um und sichert sie ab
const securePhpIndexPlugin = () => ({
  name: 'secure-php-index',
  closeBundle: () => {
    try {
      const rootDir = path.resolve('.');
      const distDir = path.resolve(rootDir, 'dist');
      const htmlPath = path.join(distDir, 'index.html');
      const phpPath = path.join(distDir, 'index.php');

      if (fs.existsSync(htmlPath)) {
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        
        // PHP-Sicherheits-Header und Logik
        const phpHeader = `<?php
// SICHERHEITS-CHECK
$ACCESS_KEY = 'SchulManager_2024_Safe!';

// 1. Zugriff nur mit korrektem Key
if (!isset($_GET['access']) || $_GET['access'] !== $ACCESS_KEY) {
    http_response_code(403);
    die('<div style="font-family:sans-serif;text-align:center;margin-top:20%;"><h1>403 Zugriff verweigert</h1><p>Der Zugriff auf diese Anwendung ist gesperrt.</p></div>');
}

// 2. Sicherheits-Header setzen
// Erlaubt Einbindung in itslearning und auf der eigenen Domain
header("Content-Security-Policy: frame-ancestors 'self' https://*.itslearning.com");
// Erzwingt HTTPS
header("Strict-Transport-Security: max-age=31536000; includeSubDomains");
?>
`;
        // PHP-Code vor das HTML hängen
        fs.writeFileSync(phpPath, phpHeader + htmlContent);
        
        // Die unsichere HTML-Datei löschen, damit sie nicht direkt aufgerufen werden kann
        fs.unlinkSync(htmlPath);
        
        console.log('\x1b[32m%s\x1b[0m', '🔒 index.html wurde zu index.php konvertiert und mit Sicherheitssperre versehen.');
      }
    } catch (error) {
      console.error('Fehler bei der PHP-Konvertierung:', error);
    }
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    copyApiPlugin(),
    securePhpIndexPlugin() // Das neue Sicherheits-Plugin aktivieren
  ],
  base: './', 
});