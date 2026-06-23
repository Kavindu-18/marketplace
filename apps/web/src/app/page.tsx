import type { ApiStatus } from '@marketplace/shared';

// Placeholder — real home page built in a later task.
export default function HomePage() {
  const status: ApiStatus = 'ok';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Marketplace
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Find trusted service providers near you — Sri Lanka
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card px-6 py-4 text-sm text-muted-foreground">
        <span className="font-mono">@marketplace/shared</span> import works —
        status: <span className="font-mono text-primary">{status}</span>
      </div>

      <p className="text-xs text-muted-foreground">
        Scaffold phase · UI coming soon
      </p>
    </main>
  );
}
