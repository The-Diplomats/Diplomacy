
import "./GameRules.css";

export default function GameRules() {
  return (
    <main className="game-rules">
      {/* Page Header */}
      <header className="game-rules-header">
        <h1>How to Play Diplomacy</h1>
        <p>
          Welcome to Diplomacy Online! Learn the basic rules
          before starting your first game.
        </p>
      </header>

      {/* Game Rules Content */}
      <div className="game-rules-content">
        {/* Objective */}
        <section className="game-rules-section">
          <h2>Objective of the Game</h2>
          <p>
            Diplomacy is a strategy game where seven European
            powers compete for control of supply centers.
            The first player to control at least 18 supply
            centers wins the game.
          </p>
        </section>

        {/* Diplomacy Phase */}
        <section className="game-rules-section">
          <h2>Diplomacy Phase</h2>
          <p>
            Players negotiate, form alliances, and discuss
            strategies with other players. Agreements are
            not binding, so alliances may change throughout
            the game.
          </p>
        </section>

        {/* Orders Phase */}
        <section className="game-rules-section">
          <h2>Orders Phase</h2>
          <p>
            Players secretly submit orders for their armies
            and fleets. Units can hold their position,
            move to another territory, or support other
            units. Fleets can also convoy armies across water.
          </p>
        </section>

        {/* Resolving Orders */}
        <section className="game-rules-section">
          <h2>Resolving Orders</h2>
          <p>
            All orders are resolved simultaneously.
            Movement conflicts are resolved according
            to Diplomacy's movement and support rules.
          </p>
        </section>

        {/* Retreats and Adjustments */}
        <section className="game-rules-section">
          <h2>Retreats and Adjustments</h2>
          <p>
            Dislodged units may retreat or be disbanded.
            After Fall turns, players may build or remove
            units depending on their supply center counts.
          </p>
        </section>

        {/* Winning the Game */}
        <section className="game-rules-section">
          <h2>Winning the Game</h2>
          <p>
            The first player to control 18 supply centers
            wins the game. Players may also agree to a draw.
          </p>
        </section>
      </div>

      {/* Back to Main Menu */}
      <footer className="game-rules-footer">
        <a href="/" className="game-rules-back">
          Back to Main Menu
        </a>
      </footer>
    </main>
  );
}
