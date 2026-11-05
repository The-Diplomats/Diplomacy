
import { Link } from 'react-router';
export default function GameRules() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold">How to Play Diplomacy</h1>
        <p className="mt-4 text-lg">
          Learn the basic rules before starting your first game.
        </p>
      </header>

      <div className="space-y-6">
        <section className="rounded-lg border p-6">
          <h2 className="mb-3 text-2xl font-semibold">
            Objective of the Game
          </h2>
          <p>
            Diplomacy is a strategy game where seven European powers
            compete for control of supply centers. The first player
            to control at least 18 supply centers wins the game.
          </p>
        </section>

        <section className="rounded-lg border p-6">
          <h2 className="mb-3 text-2xl font-semibold">Diplomacy Phase</h2>
          <p>
            Players negotiate, form alliances, and discuss strategies.
            Agreements are not binding, so alliances may change.
          </p>
        </section>

        <section className="rounded-lg border p-6">
          <h2 className="mb-3 text-2xl font-semibold">Orders Phase</h2>
          <p>
            Players secretly submit orders for their armies and fleets.
            Units can hold, move, or support other units. Fleets can
            also convoy armies across water.
          </p>
        </section>

        <section className="rounded-lg border p-6">
          <h2 className="mb-3 text-2xl font-semibold">Resolving Orders</h2>
          <p>
            All orders are resolved simultaneously. Conflicts are
            resolved using the game's movement and support rules.
          </p>
        </section>

        <section className="rounded-lg border p-6">
          <h2 className="mb-3 text-2xl font-semibold">
            Retreats and Adjustments
          </h2>
          <p>
            Dislodged units may retreat or be disbanded. After Fall
            turns, players may build or remove units depending on
            their supply center counts.
          </p>
        </section>

        <section className="rounded-lg border p-6">
          <h2 className="mb-3 text-2xl font-semibold">Winning the Game</h2>
          <p>
            The first player to control 18 supply centers wins.
            Players may also agree to a draw.
          </p>
        </section>
      </div>

      <footer className="mt-10 text-center">
        <Link
          to="/lobby"
          className="inline-block rounded-lg border px-6 py-3 font-medium hover:bg-gray-100 hover:text-gray-900"
        >
          Back to Lobby
    </Link>
      </footer>
    </main>
  );
}
