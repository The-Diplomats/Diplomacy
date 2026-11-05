import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App.tsx';

async function enableMocks() {
  if (import.meta.env.VITE_USE_MSW !== 'true') {
    return;
  }
  const { worker } = await import('../mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

enableMocks().then(() => {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
