import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { LoadingOverlay } from './components/LoadingOverlay.tsx';
import { AuthGate } from './features/auth/AuthGate.tsx';
import { AuthPanel } from './features/auth/AuthPanel.tsx';
import { GamePage } from './features/game/GamePage.tsx';
import { LobbyPage } from './features/lobby/LobbyPage.tsx';
import { MapBackdrop } from './features/map/MapBackdrop.tsx';
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
            <Route path="/" element={<Navigate to="/lobby" replace />} />
            <Route path="/auth/login" element={<AuthPanel mode="login" />} />
            <Route path="/auth/register" element={<AuthPanel mode="register" />} />
            <Route path="/auth/register/verify" element={<AuthPanel mode="register-verify" />} />
            <Route path="/auth/password-reset" element={<AuthPanel mode="password-reset" />} />
            <Route
              path="/auth/password-reset/verify"
              element={<AuthPanel mode="password-reset-verify" />}
            />
            <Route
              path="/lobby"
              element={
                <AuthGate>
                  <LobbyPage />
                </AuthGate>
              }
            />
            <Route
              path="/game/:id"
              element={
                <AuthGate>
                  <GamePage />
                </AuthGate>
              }
            />
            <Route path="/rules" element={<GameRules />} />
            <Route path="*" element={<Navigate to="/lobby" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
