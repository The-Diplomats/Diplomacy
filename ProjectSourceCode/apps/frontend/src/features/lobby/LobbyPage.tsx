
import { BookOpen, Plus, Users } from 'lucide-react';
import { Link } from 'react-router';

import mapThumbnail from '../../../maps/classical.svg?url';
import { Themed } from '../../components/Themed';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { UserMenu } from '../game/hud/UserMenu';

type GameStatus = 'active' | 'open' | 'waiting';

type LobbyGame = {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
  phase: string;
  deadline?: string;
  status: GameStatus;
};

const MOCK_GAMES: LobbyGame[] = [
  {
    id: 'autumn-classic',
    name: 'Autumn Classic',
    players: 7,
    maxPlayers: 7,
    phase: 'Fall 1904 · Movement',
    deadline: '04:32',
    status: 'active',
  },
  {
    id: 'spring-rapid',
    name: 'Spring Rapid',
    players: 7,
    maxPlayers: 7,
    phase: 'Spring 1902 · Retreat',
    deadline: '18:04',
    status: 'active',
  },
  {
    id: 'novice-ladder',
    name: 'Novice Ladder #12',
    players: 5,
    maxPlayers: 7,
    phase: 'Awaiting players',
    status: 'open',
  },
];

const STATUS_LABEL: Record<GameStatus, string> = {
  active: 'Active',
  open: 'Open to join',
  waiting: 'Waiting',
};

export function LobbyPage() {
  return (
    <Themed className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center">
      <div
        className="relative flex flex-col overflow-y-auto"
        style={{
          aspectRatio: '2120 / 1427',
          width: 'min(100vw, calc(100vh * 2120 / 1427))',
          height: 'min(100vh, calc(100vw * 1427 / 2120))',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-background/10 backdrop-blur-sm"
          aria-hidden
        />

        <div className="pointer-events-auto absolute top-[3%] right-[2%] z-20">
          <UserMenu />
        </div>

        <main className="pointer-events-auto relative mx-auto flex w-full max-w-3xl flex-col gap-6 px-8 pt-[8%] pb-8">
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold text-foreground">
                Games
              </h2>
              <p className="text-sm text-foreground/75">
                Join an active round or spin one up yourself.
              </p>
            </div>

            {/* Game Rules and New Game buttons */}
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link to="/rules">
                  <BookOpen className="h-4 w-4" />
                  How to Play
                </Link>
              </Button>

              <NewGameButton />
            </div>
          </div>

          {MOCK_GAMES.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-4">
              {MOCK_GAMES.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </main>
      </div>
    </Themed>
  );
}

function GameCard({ game }: { game: LobbyGame }) {
  return (
    <Card
      size="sm"
      className="flex-row gap-0 overflow-hidden bg-card/95 p-0 shadow-lg backdrop-blur-sm transition hover:shadow-xl"
    >
      <div className="w-52 shrink-0 self-stretch bg-muted">
        <img
          src={mapThumbnail}
          alt=""
          className="h-full w-full object-cover object-center"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-base font-bold">
              {game.name}
            </CardTitle>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>
                {game.players}/{game.maxPlayers} players
              </span>
            </div>
          </div>

          <Badge
            variant={game.status === 'active' ? 'default' : 'secondary'}
          >
            {STATUS_LABEL[game.status]}
          </Badge>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {game.phase}
          </span>

          {game.deadline && (
            <span className="font-mono text-xs font-semibold text-foreground">
              {game.deadline}
            </span>
          )}
        </div>

        <Button variant="outline" size="sm" className="self-end">
          Open
        </Button>
      </div>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="flex flex-col items-center gap-3 bg-card/95 p-10 text-center shadow-lg backdrop-blur-sm">
      <Users className="h-8 w-8 text-muted-foreground" />

      <div className="flex flex-col gap-1">
        <div className="text-base font-semibold text-foreground">
          No games yet
        </div>

        <div className="text-sm text-muted-foreground">
          Create a game and invite your diplomats.
        </div>
      </div>

      <NewGameButton />
    </Card>
  );
}

function NewGameButton() {
  return (
    <Button>
      <Plus />
      New game
    </Button>
  );
}

