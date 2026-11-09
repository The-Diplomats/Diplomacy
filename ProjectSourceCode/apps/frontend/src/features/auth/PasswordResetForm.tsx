import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { AuthField } from './AuthFormParts';
import { authErrorMessage, usePasswordReset } from './useSession';
import { isValidEmail } from './validation';

type Errors = Partial<Record<'email', string>>;

export function PasswordResetForm() {
  const navigate = useNavigate();
  const reset = usePasswordReset();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');

  const submit = (event: { preventDefault(): void }) => {
    event.preventDefault();
    setFormError('');
    const er: Errors = {};
    if (!isValidEmail(email.trim())) {
      er.email = 'Enter a valid email address.';
    }
    setErrors(er);
    if (Object.keys(er).length) {
      return;
    }

    reset.mutate(
      { email: email.trim() },
      {
        onSuccess: () => {
          const params = new URLSearchParams({ email: email.trim() });
          const next = searchParams.get('next');
          if (next) {
            params.set('next', next);
          }
          navigate(`/auth/password-reset/verify?${params.toString()}`);
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
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((er) => ({ ...er, email: undefined }));
            }}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-msg' : undefined}
          />
        </AuthField>
        <Button type="submit" className="w-full" disabled={reset.isPending}>
          {reset.isPending ? 'Sending…' : 'Send reset code'}
          {!reset.isPending && <ChevronRight />}
        </Button>
      </form>
    </>
  );
}
