import { ChevronRight } from 'lucide-react';
import { type ChangeEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { AuthField, PasswordInput, PasswordStrengthMeter } from './AuthFormParts';
import { OAuthButtons } from './OAuthButtons';
import { SignedInPanel } from './SignedInPanel';
import { authErrorMessage, useRegister, useSession } from './useSession';
import { isValidEmail, USERNAME_PATTERN } from './validation';

type Field = 'email' | 'username' | 'password' | 'confirm';
type Errors = Partial<Record<Field, string>>;

const MIN_PASSWORD_LENGTH = 8;

export function RegisterForm() {
  const navigate = useNavigate();
  const session = useSession();
  const register = useRegister();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState<Record<Field, string>>({
    email: '',
    username: '',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (session.data) {
    return <SignedInPanel user={session.data} />;
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

  const submit = (event: { preventDefault(): void }) => {
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
        onSuccess: () => {
          const params = new URLSearchParams({ identifier: form.email.trim() });
          const next = searchParams.get('next');
          if (next) {
            params.set('next', next);
          }
          navigate(`/auth/register/verify?${params.toString()}`);
        },
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
          {register.isPending ? 'Sending code…' : 'Create account'}
          {!register.isPending && <ChevronRight />}
        </Button>
      </form>

      <OAuthButtons />
    </>
  );
}
