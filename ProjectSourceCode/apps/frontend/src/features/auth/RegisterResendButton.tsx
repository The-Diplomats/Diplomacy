import { useState } from 'react';
import { useSearchParams } from 'react-router';

import { authErrorMessage, useRegisterResend } from './useSession';

export function RegisterResendButton() {
  const resend = useRegisterResend();
  const [searchParams] = useSearchParams();
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');

  const identifier = searchParams.get('identifier') ?? '';

  function click() {
    setResent(false);
    setError('');
    resend.mutate(
      { identifier: identifier.trim() },
      {
        onSuccess: () => setResent(true),
        onError: (err) => setError(authErrorMessage(err)),
      },
    );
  }

  if (!identifier.trim()) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={click}
        disabled={resend.isPending}
        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-50"
      >
        {resend.isPending ? 'Resending…' : 'Resend code'}
      </button>
      {resent && (
        <span className="text-xs text-muted-foreground">
          If unverified, a fresh code is on its way.
        </span>
      )}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
