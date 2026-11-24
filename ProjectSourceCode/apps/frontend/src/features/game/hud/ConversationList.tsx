import type { Player } from '@diplomacy/contracts';

import { POWER_COLORS } from '../../map/powers';

/** Displays the name for a seat, which is the username
 * or AI: (power) for AI players */
export function playerName(player: Player): string {
  if (player.username) {
    return player.username;
  }
  return player.power ? `AI: (${player.power})` : 'AI';
}

type RowProps = {
  label: string;
  detail: string;
  color: string;
  initials: string;
  onClick: () => void;
};

function ConversationRow({ label, detail, color, initials, onClick }: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/60"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-foreground">{label}</span>
        <span className="truncate text-xs text-muted-foreground">{detail}</span>
      </div>
    </button>
  );
}

type Props = {
  players: Player[];
  myPlayerId: string | undefined;
  onSelect: (participantId: string | null) => void;
};

export function ConversationList({ players, myPlayerId, onSelect }: Props) {
  const others = players.filter((player) => player.id !== myPlayerId);

  return (
    <div className="flex flex-col oveflow-y-auto py-2">
      <ConversationRow
        label="Public chat"
        detail="Everyone in the game"
        color={POWER_COLORS.neutral.fill}
        initials="ALL"
        onClick={() => onSelect(null)}
      />
      {myPlayerId && (
        <ConversationRow
          label="Notes"
          detail="Only you can see these"
          color={POWER_COLORS.water.fill}
          initials="ME"
          onClick={() => onSelect(myPlayerId)}
        />
      )}
      {others.map((player) => (
        <ConversationRow
          key={player.id}
          label={playerName(player)}
          detail={player.power ?? 'No power assigned yet'}
          color={POWER_COLORS[player.power ?? 'neutral'].fill}
          initials={playerName(player).slice(0, 2).toUpperCase()}
          onClick={() => onSelect(player.id)}
        />
      ))}
    </div>
  );
}
