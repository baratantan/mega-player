import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { IptvProvider } from './context/IptvContext';
import { errorLogService } from './services/errorLogService';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

// Initialize global error, unhandled rejection, and network capture
errorLogService.init();

// Register Service Worker for Android PWA WebAPK standalone installation and caching
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('[CinemaPro PWA] Update available');
    },
    onOfflineReady() {
      console.log('[CinemaPro PWA] App ready for standalone offline & native Android use');
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IptvProvider>
      <App />
    </IptvProvider>
  </StrictMode>,
);
