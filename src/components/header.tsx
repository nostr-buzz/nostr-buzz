interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  relayCount?: number;
}

export function Header({ onRefresh, isRefreshing, relayCount }: HeaderProps) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-4 inline-flex items-center rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
          Live MVP
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Nostr Buzz
        </h1>
        <p className="mt-2 text-sm text-zinc-400">Trending posts from Nostr</p>
        {typeof relayCount === "number" && (
          <p className="mt-1 text-xs text-zinc-500">
            Connected relays: {relayCount}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-4 text-sm font-medium text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRefreshing ? "Refreshing..." : "Refresh"}
      </button>
    </header>
  );
}
