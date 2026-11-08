import { cn } from 'cn';
import { type ComponentProps, type ReactNode, useState } from 'react';

import { Themed } from '../../components/Themed';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { passwordStrength } from './validation';

/** Card centered over the map backdrop, shared by the login and register pages. */
export function AuthShell({
  subtitle,
  footer,
  children,
}: {
  subtitle: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Themed className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center">
      <div
        className="relative flex items-center justify-center p-6"
        style={{
          aspectRatio: '2120 / 1427',
          width: 'min(100vw, calc(100vh * 2120 / 1427))',
          height: 'min(100vh, calc(100vw * 1427 / 2120))',
        }}
      >
        <div className="absolute inset-0 bg-background/10 backdrop-blur-sm" aria-hidden />
        <Card
          size="sm"
          className="pointer-events-auto relative w-96 gap-5 bg-card/95 shadow-xl backdrop-blur-sm"
        >
          <CardHeader className="items-center space-y-1 text-center">
            <h1
              className="text-5xl text-foreground"
              style={{ fontFamily: '"Great Vibes", cursive' }}
            >
              Diplomacy
            </h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </CardHeader>

          <CardContent>{children}</CardContent>

          {footer && <div className="pb-5 text-center text-xs text-muted-foreground">{footer}</div>}
        </Card>
      </div>
    </Themed>
  );
}

/** Label + input slot + inline error (or hint). Wire `aria-describedby={`${id}-msg`}` on the input. */
export function AuthField({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  const message = error ?? hint;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {message && (
        <p
          id={`${id}-msg`}
          className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}
        >
          {message}
        </p>
      )}
    </div>
  );
}

/** Password input with a Show/Hide toggle. */
export function PasswordInput({
  visible,
  onToggleVisible,
  className,
  ...props
}: Omit<ComponentProps<typeof Input>, 'type'> & {
  visible?: boolean;
  onToggleVisible?: () => void;
}) {
  const [localVisible, setLocalVisible] = useState(false);
  const shown = visible ?? localVisible;
  const toggle = onToggleVisible ?? (() => setLocalVisible((v) => !v));

  return (
    <div className="relative">
      <Input {...props} type={shown ? 'text' : 'password'} className={cn('pr-14', className)} />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={shown}
        aria-label={shown ? 'Hide password' : 'Show password'}
        className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded px-1.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {shown ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  const score = passwordStrength(password);
  return (
    <div className="flex gap-1" aria-hidden>
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          className={cn('h-1 flex-1 rounded-full', n <= score ? 'bg-primary' : 'bg-muted')}
        />
      ))}
    </div>
  );
}
