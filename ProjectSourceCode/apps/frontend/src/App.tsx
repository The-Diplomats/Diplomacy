
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { LoadingOverlay } from './components/LoadingOverlay.tsx';
import { LoginPage } from './features/auth/LoginPage.tsx';
import { RegisterPage } from './features/auth/RegisterPage.tsx';
import { GamePage } from './features/game/GamePage.tsx';
import { LobbyPage } from './features/lobby/LobbyPage.tsx';
import { MapBackdrop } from './features/map/MapBackdrop.tsx';

// New: Import Game Rules Page
import GameRules from './features/rules/GameRules.tsx';

const queryClient = new QueryClient();

export function App() {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="light"
      enableSystem={false}
      enableColorScheme={false}
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <LoadingOverlay />
        <BrowserRouter>
          <MapBackdrop />
          <Routes>
            <Route path="/" element={<Navigate to="/game/test" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/lobby" element={<LobbyPage />} />
            <Route path="/game/:id" element={<GamePage />} />

            {/* New: Game Rules Page route */}
            <Route path="/rules" element={<GameRules />} />

            <Route path="*" element={<LobbyPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
