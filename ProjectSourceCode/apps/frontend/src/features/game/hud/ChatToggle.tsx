import { MessageSquare } from 'lucide-react';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';

type Props = {
  unread?: number;
  onClick?: () => void;
};

export function ChatToggle({ unread = 0, onClick }: Props) {
  return (
    <div className="pointer-events-auto relative">
      <Button
        variant="ghost"
        size="icon-lg"
        onClick={onClick}
        aria-label={unread > 0 ? `Chat (${unread} unread)` : 'Chat'}
        className="rounded-full bg-card/95 shadow-lg ring-1 ring-border backdrop-blur-sm hover:bg-card hover:shadow-xl"
      >
        <MessageSquare />
      </Button>
      {unread > 0 && (
        <Badge className="pointer-events-none absolute -top-1 -right-1 h-5 min-w-5 rounded-full border-2 border-background px-1 text-[10px] font-semibold bg-red-300 text-red-700 dark:bg-red-950 dark:text-red-300">
          {unread > 9 ? '9+' : unread}
        </Badge>
      )}
    </div>
  );
}
