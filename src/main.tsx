import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { IptvProvider } from './context/IptvContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IptvProvider>
      <App />
    </IptvProvider>
  </StrictMode>,
);
