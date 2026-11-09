import { ChevronRight } from 'lucide-react';
import { type ChangeEvent, type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { ApiError } from '../../api/client';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Separator } from '../../components/ui/separator';
import { AuthField, AuthShell, PasswordInput, PasswordStrengthMeter } from './AuthShell';
import { SignedInPanel } from './SignedInPanel';
import { authErrorMessage, useRegister, useSession } from './useSession';
import { isValidEmail } from './validation';

type Field = 'email' | 'username' | 'password' | 'confirm';
type Errors = Partial<Record<Field, string>>;

const MIN_PASSWORD_LENGTH = 8; // matches RegisterRequest.password.minLength
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/; // matches RegisterRequest.username.pattern

export function RegisterPage() {
  const navigate = useNavigate();
  const session = useSession();
  const register = useRegister();

  const [form, setForm] = useState<Record<Field, string>>({
    email: '',
    username: '',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const footer = (
    <>
      Already have an account?{' '}
      <Link to="/login" className="font-medium text-foreground underline underline-offset-2">
        Sign in
      </Link>
    </>
  );

  if (session.data) {
    return (
      <AuthShell subtitle="You already have an account">
        <SignedInPanel user={session.data} />
      </AuthShell>
    );
  }

  const bind = (key: Field) => ({
    value: form[key],
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setForm((f) => ({ ...f, [key]: value }));
      setErrors((er) => ({ ...er, [key]: undefined }));
    },
    'aria-invalid': !!errors[key],
    'aria-describedby': errors[key] ? `${key}-msg` : undefined,
  });

  const validate = (): Errors => {
    const er: Errors = {};
    if (!isValidEmail(form.email.trim())) {
      er.email = 'Enter a valid email address.';
    }
    if (!USERNAME_PATTERN.test(form.username.trim())) {
      er.username = '3-20 characters, letters, numbers or underscore.';
    }
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      er.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (form.confirm !== form.password) {
      er.confirm = "Passwords don't match.";
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

    register.mutate(
      {
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
      },
      {
        onSuccess: () => navigate('/lobby'),
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409) {
            setErrors({ email: 'An account with this email or username already exists.' });
          } else {
            setFormError(authErrorMessage(err));
          }
        },
      },
    );
  };

  return (
    <AuthShell subtitle="Create an account to play" footer={footer}>
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
            {...bind('email')}
          />
        </AuthField>
        <AuthField id="username" label="Username" error={errors.username}>
          <Input
            id="username"
            type="text"
            placeholder="your_handle"
            autoComplete="username"
            {...bind('username')}
          />
        </AuthField>
        <AuthField
          id="password"
          label="Password"
          error={errors.password}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters. Mix letters, numbers and symbols.`}
        >
          <PasswordInput
            id="password"
            placeholder="••••••••"
            autoComplete="new-password"
            visible={showPassword}
            onToggleVisible={() => setShowPassword((v) => !v)}
            {...bind('password')}
          />
          {form.password && <PasswordStrengthMeter password={form.password} />}
        </AuthField>
        <AuthField id="confirm" label="Confirm password" error={errors.confirm}>
          <Input
            id="confirm"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            {...bind('confirm')}
          />
        </AuthField>
        <Button type="submit" className="w-full" disabled={register.isPending}>
          {register.isPending ? 'Creating account…' : 'Create account'}
          {!register.isPending && <ChevronRight />}
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
