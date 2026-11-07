import { LogOut, Moon, Settings, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router';

import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { useLogout, useSession } from '../../auth/useSession';

export function UserMenu() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const { data: user } = useSession();
  const logout = useLogout();

  // User has no display name yet; derive one from the email's local part.
  const userName = user ? (user.email.split('@')[0] ?? user.email) : 'Guest';
  const initial = userName.charAt(0).toUpperCase();

  const signOut = () => logout.mutate(undefined, { onSettled: () => navigate('/login') });

  return (
    <div className="pointer-events-auto">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="User menu"
          className="rounded-full shadow-lg ring-1 ring-border transition hover:ring-ring focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 p-0">
          <div className="flex flex-col items-center gap-2 px-4 pt-5 pb-4 text-center">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-xl text-primary-foreground">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">Hi, {userName}!</span>
              {user && <span className="text-xs text-muted-foreground">{user.email}</span>}
            </div>
          </div>
          <DropdownMenuSeparator className="my-0" />
          <div className="p-1">
            <DropdownMenuItem onClick={() => setTheme(isDark ? 'light' : 'dark')}>
              {isDark ? <Sun /> : <Moon />}
              {isDark ? 'Light mode' : 'Dark mode'}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings />
              Account settings
            </DropdownMenuItem>
          </div>
          <DropdownMenuSeparator className="my-0" />
          <div className="p-1">
            <DropdownMenuItem variant="destructive" onClick={signOut}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </div>
          <div className="flex items-center justify-center gap-2 border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
            <button type="button" className="hover:text-foreground">
              Privacy
            </button>
            <span>·</span>
            <button type="button" className="hover:text-foreground">
              Terms
            </button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
