"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Header } from "@/components/header";
import { PostCard } from "@/components/post-card";
import { fetchRecentTextNotes } from "@/lib/nostr";
import type { FeedSortMode, NostrPost } from "@/types/nostr";

type FeedStatus = "loading" | "ready" | "error";

function sortPosts(posts: NostrPost[], sortMode: FeedSortMode): NostrPost[] {
  const next = [...posts];

  if (sortMode === "longest") {
    next.sort(
      (a, b) =>
        b.content.length - a.content.length || b.createdAt - a.createdAt,
    );
  } else {
    next.sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
  }

  return next.slice(0, 20);
}

interface SortButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function SortButton({ label, selected, onClick }: SortButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        selected
          ? "border-zinc-500 bg-zinc-800 text-zinc-100"
          : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
      }`}
    >
      {label}
    </button>
  );
}

function LoadingCards() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4"
        >
          <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-800" />
          <div className="mt-3 h-3 w-full animate-pulse rounded bg-zinc-900" />
          <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-zinc-900" />
        </div>
      ))}
    </div>
  );
}

export function FeedList() {
  const [posts, setPosts] = useState<NostrPost[]>([]);
  const [status, setStatus] = useState<FeedStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<FeedSortMode>("newest");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [relayCount, setRelayCount] = useState<number>(0);

  const loadPosts = useCallback(async (refreshOnly: boolean) => {
    if (refreshOnly) {
      setIsRefreshing(true);
    } else {
      setStatus("loading");
    }

    setErrorMessage(null);

    try {
      const result = await fetchRecentTextNotes({ limit: 20 });
      setPosts(result.posts);
      setRelayCount(result.relayCount);
      setStatus("ready");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not load posts from relays.";

      setErrorMessage(message);
      setStatus("error");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts(false);
  }, [loadPosts]);

  const sortedPosts = useMemo(
    () => sortPosts(posts, sortMode),
    [posts, sortMode],
  );

  return (
    <section className="space-y-6">
      <Header
        onRefresh={() => void loadPosts(true)}
        isRefreshing={isRefreshing}
        relayCount={relayCount}
      />

      <div className="flex items-center gap-2">
        <SortButton
          label="Newest"
          selected={sortMode === "newest"}
          onClick={() => setSortMode("newest")}
        />
        <SortButton
          label="Longest posts"
          selected={sortMode === "longest"}
          onClick={() => setSortMode("longest")}
        />
      </div>

      {status === "loading" && posts.length === 0 && <LoadingCards />}

      {status === "error" && posts.length === 0 && (
        <div className="rounded-2xl border border-red-500/40 bg-red-950/20 p-5 text-sm text-red-200">
          <p>Could not fetch posts from relays.</p>
          {errorMessage && <p className="mt-2 text-red-300">{errorMessage}</p>}
          <button
            type="button"
            onClick={() => void loadPosts(false)}
            className="mt-4 inline-flex rounded-lg border border-red-400/50 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-red-900/40"
          >
            Retry
          </button>
        </div>
      )}

      {status === "ready" && sortedPosts.length === 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 text-sm text-zinc-400">
          No recent text notes found right now.
        </div>
      )}

      {errorMessage && posts.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 px-4 py-3 text-xs text-amber-200">
          Refresh had issues with some relays. Showing latest successful data.
        </div>
      )}

      {sortedPosts.length > 0 && (
        <ul className="space-y-3">
          {sortedPosts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
