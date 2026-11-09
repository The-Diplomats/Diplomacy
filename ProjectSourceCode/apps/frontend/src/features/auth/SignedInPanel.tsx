import type { User } from '@diplomacy/contracts';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';

import { Button } from '../../components/ui/button';
import { useLogout } from './useSession';

/** Shown on the auth pages when a session already exists. */
export function SignedInPanel({ user }: { user: User }) {
  const navigate = useNavigate();
  const logout = useLogout();

  return (
    <div className="flex flex-col gap-4 text-center">
      <p className="text-sm text-muted-foreground">
        You're signed in as <span className="font-medium text-foreground">{user.email}</span>.
      </p>
      <Button className="w-full" onClick={() => navigate('/lobby')}>
        Continue to lobby
        <ChevronRight />
      </Button>
      <Button
        variant="outline"
        className="w-full"
        disabled={logout.isPending}
        onClick={() => logout.mutate()}
      >
        {logout.isPending ? 'Signing out…' : 'Sign out'}
      </Button>
    </div>
  );
}
