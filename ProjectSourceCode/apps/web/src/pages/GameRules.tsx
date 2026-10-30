
export default function GameRules() {
  return (
    <main className="game-rules">
      <h1>How to Play Diplomacy</h1>

      <p>
        Welcome to Diplomacy Online! Learn the basics
        before starting your first game.
      </p>

      <section>
        <h2>Objective of the Game</h2>
        <p>
          Diplomacy is a strategy game where seven
          European powers compete for control of
          supply centers. Control at least 18 supply
          centers to win the game.
        </p>
      </section>

      <section>
        <h2>Diplomacy Phase</h2>
        <p>
          Players negotiate, form alliances, and plan
          strategies. Agreements are not binding,
          so alliances can change throughout the game.
        </p>
      </section>

      <section>
        <h2>Orders Phase</h2>
        <p>
          Players secretly submit orders for their
          armies and fleets. Units can hold, move,
          or support other units. Fleets can also
          convoy armies across water.
        </p>
      </section>

      <section>
        <h2>Resolving Orders</h2>
        <p>
          All orders are resolved simultaneously.
          Movement conflicts are resolved using
          Diplomacy's movement and support rules.
        </p>
      </section>

      <section>
        <h2>Retreats and Adjustments</h2>
        <p>
          Dislodged units may retreat or be disbanded.
          After Fall turns, players may build or remove
          units depending on their supply center count.
        </p>
      </section>

      <section>
        <h2>Winning the Game</h2>
        <p>
          The first player to control 18 supply centers
          wins. Players may also agree to a draw.
        </p>
      </section>

      <a href="/">Back to Main Menu</a>
    </main>
  );
}
