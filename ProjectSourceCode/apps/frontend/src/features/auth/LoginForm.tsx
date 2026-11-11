import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Separator } from '../../components/ui/separator';
import { AuthField, PasswordInput } from './AuthFormParts';
import { SignedInPanel } from './SignedInPanel';
import { useNextPath } from './useNextPath';
import { authErrorMessage, useLogin, useSession } from './useSession';

type Errors = Partial<Record<'identifier' | 'password', string>>;

export function LoginForm() {
  const navigate = useNavigate();
  const session = useSession();
  const login = useLogin();
  const next = useNextPath();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');

  if (session.data) {
    return <SignedInPanel user={session.data} />;
  }

  const validate = (): Errors => {
    const er: Errors = {};
    if (!identifier.trim()) {
      er.identifier = 'Enter your email or username.';
    }
    if (!password) {
      er.password = 'Enter your password.';
    }
    return er;
  };

  const submit = (event: { preventDefault(): void }) => {
    event.preventDefault();
    setFormError('');
    const er = validate();
    setErrors(er);
    if (Object.keys(er).length) {
      return;
    }

    login.mutate(
      { identifier: identifier.trim(), password },
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

      <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
        <AuthField id="identifier" label="Email or username" error={errors.identifier}>
          <Input
            id="identifier"
            type="text"
            placeholder="you@diplomacy.gg"
            autoComplete="username"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              setErrors((er) => ({ ...er, identifier: undefined }));
            }}
            aria-invalid={!!errors.identifier}
            aria-describedby={errors.identifier ? 'identifier-msg' : undefined}
          />
        </AuthField>
        <AuthField id="password" label="Password" error={errors.password}>
          <PasswordInput
            id="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((er) => ({ ...er, password: undefined }));
            }}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-msg' : undefined}
          />
        </AuthField>
        <div className="text-right">
          <Link
            to="/auth/password-reset"
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
          {!login.isPending && <ChevronRight />}
        </Button>
      </form>

      <div className="relative py-4">
        <Separator />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="bg-card px-2 text-xs text-muted-foreground uppercase">or</span>
        </span>
      </div>

      <Button type="button" variant="outline" className="w-full">
        Continue with Microsoft
      </Button>
    </>
  );
}
