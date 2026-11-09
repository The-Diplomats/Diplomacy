import { cn } from 'cn';
import { type ComponentProps, type ReactNode, useState } from 'react';

import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { passwordStrength } from './validation';

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
