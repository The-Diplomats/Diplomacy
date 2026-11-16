import type { OAuthProvider } from '@diplomacy/contracts';
import { useState } from 'react';

import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { useNextPath } from './useNextPath';
import { authErrorMessage, useOAuthLogin, useOAuthProviders } from './useSession';

const PROVIDER_LABELS: Record<OAuthProvider, string> = {
  google: 'Google',
  microsoft: 'Microsoft',
};

/** "or continue with" section; renders nothing when the server has no providers configured. */
export function OAuthButtons() {
  const providers = useOAuthProviders();
  const login = useOAuthLogin();
  const next = useNextPath();
  const [error, setError] = useState('');

  if (!providers.data?.length) {
    return null;
  }

  const start = (provider: OAuthProvider) => {
    setError('');
    login.mutate({ provider, next }, { onError: (err) => setError(authErrorMessage(err)) });
  };

  // Stays pending through the full-page navigation, so the buttons stay disabled.
  const pendingProvider = login.isPending || login.isSuccess ? login.variables?.provider : null;

  return (
    <>
      <div className="relative py-4">
        <Separator />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="bg-card px-2 text-xs text-muted-foreground uppercase">or</span>
        </span>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        {providers.data.map((provider) => (
          <Button
            key={provider}
            type="button"
            variant="outline"
            className="w-full"
            disabled={!!pendingProvider}
            onClick={() => start(provider)}
          >
            <ProviderMark provider={provider} />
            {pendingProvider === provider
              ? 'Redirecting…'
              : `Continue with ${PROVIDER_LABELS[provider]}`}
          </Button>
        ))}
      </div>
    </>
  );
}

function ProviderMark({ provider }: { provider: OAuthProvider }) {
  if (provider === 'google') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true" className="size-4">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 21 21" aria-hidden="true" className="size-4">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
