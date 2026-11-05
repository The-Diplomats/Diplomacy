import { CheckCircle2 } from 'lucide-react';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';

type Props = {
  ready?: boolean;
  orderCount?: number;
  onClick?: () => void;
};

export function SubmitOrdersToggle({ ready = false, orderCount = 0, onClick }: Props) {
  return (
    <Button
      size="lg"
      onClick={onClick}
      className={`pointer-events-auto rounded-full px-5 shadow-xl backdrop-blur-sm ${
        ready
          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
          : 'bg-card/95 text-card-foreground ring-1 ring-border hover:bg-card'
      }`}
    >
      {ready && <CheckCircle2 />}
      <span>Submit Orders</span>
      {!ready && orderCount > 0 && (
        <Badge className="ml-1 rounded-full bg-foreground px-2 py-0.5 text-xs text-background">
          {orderCount}
        </Badge>
      )}
    </Button>
  );
}
