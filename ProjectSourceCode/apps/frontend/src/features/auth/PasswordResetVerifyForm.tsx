import { ChevronRight } from 'lucide-react';
import { type ChangeEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { AuthField, PasswordInput, PasswordStrengthMeter } from './AuthFormParts';
import { useNextPath } from './useNextPath';
import { authErrorMessage, usePasswordResetVerify } from './useSession';
import { isValidEmail } from './validation';

type Field = 'email' | 'code' | 'newPassword' | 'confirm';
type Errors = Partial<Record<Field, string>>;

const MIN_PASSWORD_LENGTH = 8;

export function PasswordResetVerifyForm() {
  const navigate = useNavigate();
  const verify = usePasswordResetVerify();
  const next = useNextPath();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState<Record<Field, string>>({
    email: searchParams.get('email') ?? '',
    code: searchParams.get('code') ?? '',
    newPassword: '',
    confirm: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    if (!/^\d{6}$/.test(form.code)) {
      er.code = 'Enter the 6-digit code from your email.';
    }
    if (form.newPassword.length < MIN_PASSWORD_LENGTH) {
      er.newPassword = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (form.confirm !== form.newPassword) {
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

    verify.mutate(
      { email: form.email.trim(), code: form.code, newPassword: form.newPassword },
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
        <AuthField id="email" label="Email" error={errors.email}>
          <Input
            id="email"
            type="email"
            placeholder="you@diplomacy.gg"
            autoComplete="email"
            {...bind('email')}
          />
        </AuthField>
        <AuthField id="code" label="Reset code" error={errors.code}>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            placeholder="123456"
            autoComplete="one-time-code"
            maxLength={6}
            {...bind('code')}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              setForm((f) => ({ ...f, code: value }));
              setErrors((er) => ({ ...er, code: undefined }));
            }}
          />
        </AuthField>
        <AuthField
          id="newPassword"
          label="New password"
          error={errors.newPassword}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        >
          <PasswordInput
            id="newPassword"
            placeholder="••••••••"
            autoComplete="new-password"
            visible={showPassword}
            onToggleVisible={() => setShowPassword((v) => !v)}
            {...bind('newPassword')}
          />
          {form.newPassword && <PasswordStrengthMeter password={form.newPassword} />}
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
        <Button type="submit" className="w-full" disabled={verify.isPending}>
          {verify.isPending ? 'Resetting…' : 'Reset password'}
          {!verify.isPending && <ChevronRight />}
        </Button>
      </form>
    </>
  );
}
