import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { AuthField } from './AuthFormParts';
import { SignedInPanel } from './SignedInPanel';
import { useNextPath } from './useNextPath';
import { authErrorMessage, useOAuthComplete, useOAuthPending, useSession } from './useSession';
import { USERNAME_PATTERN } from './validation';

const PROVIDER_LABELS = { google: 'Google', microsoft: 'Microsoft' } as const;

export function OAuthCompleteForm() {
  const session = useSession();
  const pending = useOAuthPending();

  if (session.data) {
    return <SignedInPanel user={session.data} />;
  }
  if (pending.isPending) {
    return null;
  }
  if (!pending.data) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-muted-foreground">
          Your sign-in expired or was already completed.
        </p>
        <Link
          to="/auth/login"
          className="text-sm font-medium text-foreground underline underline-offset-2"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <UsernameForm
      email={pending.data.email}
      providerLabel={PROVIDER_LABELS[pending.data.provider]}
      suggestedUsername={pending.data.suggestedUsername}
    />
  );
}

function UsernameForm({
  email,
  providerLabel,
  suggestedUsername,
}: {
  email: string;
  providerLabel: string;
  suggestedUsername: string;
}) {
  const navigate = useNavigate();
  const complete = useOAuthComplete();
  const next = useNextPath();

  const [username, setUsername] = useState(suggestedUsername);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const submit = (event: { preventDefault(): void }) => {
    event.preventDefault();
    setFormError('');
    const trimmed = username.trim();
    if (!USERNAME_PATTERN.test(trimmed)) {
      setError('3-20 characters, letters, numbers or underscore.');
      return;
    }

    complete.mutate(
      { username: trimmed },
      {
        onSuccess: () => navigate(next, { replace: true }),
        onError: (err) => setFormError(authErrorMessage(err)),
      },
    );
  };

  return (
    <>
      {formError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="text-destructive">{formError}</AlertDescription>
        </Alert>
      )}

      <p className="mb-4 text-center text-sm text-muted-foreground">
        Signed in with {providerLabel} as{' '}
        <span className="font-medium text-foreground">{email}</span>
      </p>

      <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
        <AuthField id="username" label="Username" error={error}>
          <Input
            id="username"
            type="text"
            placeholder="your_handle"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setError('');
            }}
            aria-invalid={!!error}
            aria-describedby={error ? 'username-msg' : undefined}
          />
        </AuthField>
        <Button type="submit" className="w-full" disabled={complete.isPending}>
          {complete.isPending ? 'Creating account…' : 'Create account'}
          {!complete.isPending && <ChevronRight />}
        </Button>
      </form>
    </>
  );
}
