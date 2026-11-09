import { Link } from 'react-router';

const RULES = [
  {
    title: 'Be respectful',
    body: 'Do not use chat to harass, threaten, insult, or target another player. Personal attacks and hateful language are not allowed.',
  },
  {
    title: 'Keep games in the game',
    body: 'Diplomacy and competition are part of play, but do not carry grudges or pursue bad blood from one game into another. Treat each new game as a fresh start.',
  },
  {
    title: 'One account per person',
    body: 'Do not create or use multiple accounts, including to influence a game or evade a site restriction.',
  },
];

export default function SiteRules() {
  return (
    <div className="fixed inset-0 z-20 overflow-y-auto bg-background/90 text-foreground backdrop-blur-sm">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold">Site Rules</h1>
          <p className="mt-4 text-lg">
            Help keep every game fair, competitive, and enjoyable for everyone. These rules apply to
            all players and all games on this site.
          </p>
        </header>

        <ol className="space-y-6">
          {RULES.map((rule, i) => (
            <li key={rule.title}>
              <section className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-3 text-2xl font-semibold">
                  {i + 1}. {rule.title}
                </h2>
                <p>{rule.body}</p>
              </section>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-center">
          Please report rule violations through the site&apos;s available reporting tools. The site
          may take action when these rules are broken.
        </p>

        <footer className="mt-10 text-center">
          <Link
            to="/lobby"
            className="inline-block rounded-lg border border-border bg-card px-6 py-3 font-medium transition-colors hover:bg-muted"
          >
            Back to Lobby
          </Link>
        </footer>
      </main>
    </div>
  );
}
