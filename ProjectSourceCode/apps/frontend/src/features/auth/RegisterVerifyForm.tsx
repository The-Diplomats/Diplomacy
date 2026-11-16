import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../../components/ui/input-otp';
import { AuthField } from './AuthFormParts';
import { SignedInPanel } from './SignedInPanel';
import { useNextPath } from './useNextPath';
import { authErrorMessage, useRegisterVerify, useSession } from './useSession';

type Errors = Partial<Record<'identifier' | 'code', string>>;

export function RegisterVerifyForm() {
  const navigate = useNavigate();
  const session = useSession();
  const verify = useRegisterVerify();
  const next = useNextPath();
  const [searchParams] = useSearchParams();

  const [identifier, setIdentifier] = useState(searchParams.get('identifier') ?? '');
  const [code, setCode] = useState(searchParams.get('code') ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (searchParams.get('code') && searchParams.get('identifier')) {
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (session.data) {
    return <SignedInPanel user={session.data} />;
  }

  function submit(event?: { preventDefault(): void }) {
    event?.preventDefault();
    setFormError('');
    const er: Errors = {};
    if (!identifier.trim()) {
      er.identifier = 'Enter your email or username.';
    }
    if (!/^\d{6}$/.test(code)) {
      er.code = 'Enter the 6-digit code from your email.';
    }
    setErrors(er);
    if (Object.keys(er).length) {
      return;
    }

    verify.mutate(
      { identifier: identifier.trim(), code },
      {
        onSuccess: () => navigate(next, { replace: true }),
        onError: (err) => setFormError(authErrorMessage(err)),
      },
    );
  }

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
        <AuthField id="code" label="Verification code" error={errors.code}>
          <InputOTP
            id="code"
            maxLength={6}
            pattern="^\d*$"
            autoComplete="one-time-code"
            value={code}
            onChange={(value) => {
              setCode(value);
              setErrors((er) => ({ ...er, code: undefined }));
            }}
            aria-invalid={!!errors.code}
            aria-describedby={errors.code ? 'code-msg' : undefined}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </AuthField>
        <Button type="submit" className="w-full" disabled={verify.isPending}>
          {verify.isPending ? 'Verifying…' : 'Verify'}
          {!verify.isPending && <ChevronRight />}
        </Button>
      </form>
    </>
  );
}
