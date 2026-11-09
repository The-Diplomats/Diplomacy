import { Link } from 'react-router';

import { Themed } from '../../components/Themed';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { LoginForm } from './LoginForm';
import { PasswordResetForm } from './PasswordResetForm';
import { PasswordResetVerifyForm } from './PasswordResetVerifyForm';
import { RegisterForm } from './RegisterForm';
import { RegisterResendButton } from './RegisterResendButton';
import { RegisterVerifyForm } from './RegisterVerifyForm';

export type AuthMode =
  'login' | 'register' | 'register-verify' | 'password-reset' | 'password-reset-verify';

export function AuthPanel({ mode }: { mode: AuthMode }) {
  return (
    <Themed className="pointer-events-none fixed inset-0 z-10 flex items-center justify-start p-6">
      <Card
        size="sm"
        className="pointer-events-auto w-96 gap-5 bg-card/95 shadow-xl backdrop-blur-sm"
      >
        <CardHeader className="items-center space-y-1 text-center">
          <h1 className="text-5xl text-foreground" style={{ fontFamily: '"Great Vibes", cursive' }}>
            Diplomacy
          </h1>
          <p className="text-sm text-muted-foreground">{subtitleFor(mode)}</p>
        </CardHeader>

        <CardContent>
          {mode === 'login' && <LoginForm />}
          {mode === 'register' && <RegisterForm />}
          {mode === 'register-verify' && <RegisterVerifyForm />}
          {mode === 'password-reset' && <PasswordResetForm />}
          {mode === 'password-reset-verify' && <PasswordResetVerifyForm />}
        </CardContent>

        <div className="space-y-2 pb-5 text-center text-xs text-muted-foreground">
          {mode === 'register-verify' && <RegisterResendButton />}
          {footerFor(mode)}
        </div>
      </Card>
    </Themed>
  );
}

function subtitleFor(mode: AuthMode): string {
  switch (mode) {
    case 'login':
      return 'Sign in to join the next round';
    case 'register':
      return 'Create an account to play';
    case 'register-verify':
      return 'Enter the code we emailed you';
    case 'password-reset':
      return 'Enter your email to get a reset code';
    case 'password-reset-verify':
      return 'Enter the code and your new password';
  }
}

function footerFor(mode: AuthMode): React.ReactNode {
  if (mode === 'login' || mode === 'password-reset') {
    return (
      <>
        No account?{' '}
        <Link
          to="/auth/register"
          className="font-medium text-foreground underline underline-offset-2"
        >
          Register
        </Link>
      </>
    );
  }
  return (
    <>
      Already have an account?{' '}
      <Link to="/auth/login" className="font-medium text-foreground underline underline-offset-2">
        Sign in
      </Link>
    </>
  );
}
