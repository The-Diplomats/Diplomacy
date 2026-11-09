import { ChevronRight } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Separator } from '../../components/ui/separator';
import { AuthField, AuthShell, PasswordInput } from './AuthShell';
import { SignedInPanel } from './SignedInPanel';
import { authErrorMessage, useLogin, useSession } from './useSession';
import { isValidEmail } from './validation';

type Errors = Partial<Record<'email' | 'password', string>>;

export function LoginPage() {
  const navigate = useNavigate();
  const session = useSession();
  const login = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');

  const footer = (
    <>
      No account?{' '}
      <Link to="/register" className="font-medium text-foreground underline underline-offset-2">
        Register
      </Link>
    </>
  );

  if (session.data) {
    return (
      <AuthShell subtitle="Welcome back">
        <SignedInPanel user={session.data} />
      </AuthShell>
    );
  }

  const validate = (): Errors => {
    const er: Errors = {};
    if (!isValidEmail(email.trim())) {
      er.email = 'Enter a valid email address.';
    }
    if (!password) {
      er.password = 'Enter your password.';
    }
    return er;
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    const er = validate();
    setErrors(er);
    if (Object.keys(er).length) {
      return;
    }

    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => navigate('/lobby'),
        onError: (err) => setFormError(authErrorMessage(err)),
      },
    );
  };

  return (
    <AuthShell subtitle="Sign in to join the next round" footer={footer}>
      {formError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="text-destructive">{formError}</AlertDescription>
        </Alert>
      )}

      <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
        <AuthField id="email" label="Email" error={errors.email}>
          <Input
            id="email"
            type="email"
            placeholder="you@diplomacy.gg"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((er) => ({ ...er, email: undefined }));
            }}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-msg' : undefined}
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
    </AuthShell>
  );
}
