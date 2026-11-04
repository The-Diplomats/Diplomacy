import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router';

import { LoginPage } from './features/auth/LoginPage.tsx';
import { GamePage } from './features/game/GamePage.tsx';
import { LobbyPage } from './features/lobby/LobbyPage.tsx';
import { MapBackdrop } from './features/map/MapBackdrop.tsx';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MapBackdrop />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/game/:id" element={<GamePage />} />
          <Route path="*" element={<LobbyPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
