/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";
import { RichContent } from "@/components/rich-content";
import type { NostrPost } from "@/types/nostr";

function shorten(value: string, start = 10, end = 8): string {
  if (value.length <= start + end + 3) {
    return value;
  }

  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function formatDate(createdAt: number): string {
  return new Date(createdAt * 1000).toLocaleString();
}

function formatDateIso(createdAt: number): string {
  return new Date(createdAt * 1000).toISOString();
}

function getAuthorName(post: NostrPost): string {
  return (
    post.author.displayName ||
    post.author.name ||
    shorten(post.pubkey, 12, 8)
  );
}

interface PostCardProps {
  post: NostrPost;
}

export function PostCard({ post }: PostCardProps) {
  const [expanded, setExpanded] = useState(false);

  const lineCount = post.content.split(/\r?\n/).length;
  const isLong = post.content.length > 320 || lineCount > 4;
  const authorName = getAuthorName(post);
  const avatarSeed = authorName
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2)
    .toUpperCase();

  const eventMetadata = useMemo(
    () => ({
      id: post.id,
      pubkey: post.pubkey,
      createdAtUnix: post.createdAt,
      createdAtIso: formatDateIso(post.createdAt),
      kind: post.metadata.kind,
      sig: post.metadata.sig,
      hashtags: post.metadata.hashtags,
      links: post.metadata.links,
      subject: post.metadata.subject,
      title: post.metadata.title,
      summary: post.metadata.summary,
      client: post.metadata.client,
      tags: post.metadata.tags,
      metrics: post.metrics,
    }),
    [post],
  );

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 shadow-sm sm:p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {post.author.picture ? (
            <img
              src={post.author.picture}
              alt={authorName}
              className="h-10 w-10 rounded-full border border-zinc-700 object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xs font-semibold text-zinc-300">
              {avatarSeed || "NP"}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-100">{authorName}</p>
            <p className="truncate text-xs text-zinc-400">{shorten(post.pubkey, 18, 10)}</p>
            {post.author.nip05 && (
              <p className="truncate text-xs text-zinc-500">{post.author.nip05}</p>
            )}
          </div>
        </div>

        <div className="text-right text-xs text-zinc-400">
          <p>{formatDate(post.createdAt)}</p>
          <p className="mt-1">Event: {shorten(post.id, 12, 8)}</p>
          <p className="mt-1">Kind: {post.metadata.kind}</p>
        </div>
      </header>

      {post.author.about && (
        <p className="mb-3 max-h-10 overflow-hidden text-xs leading-5 text-zinc-400">
          {post.author.about}
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-zinc-300">
          Replies: {post.metrics.replies}
        </span>
        <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-zinc-300">
          Reposts: {post.metrics.reposts}
        </span>
        <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-zinc-300">
          Reactions: {post.metrics.reactions}
        </span>
        <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-zinc-300">
          Zaps: {post.metrics.zaps}
        </span>
      </div>

      {(post.metadata.title || post.metadata.subject || post.metadata.summary) && (
        <div className="mb-3 space-y-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
          {post.metadata.title && (
            <p className="text-sm font-semibold text-zinc-100">
              {post.metadata.title}
            </p>
          )}
          {post.metadata.subject && (
            <p className="text-xs uppercase tracking-wide text-zinc-400">
              {post.metadata.subject}
            </p>
          )}
          {post.metadata.summary && (
            <p className="text-sm text-zinc-300">{post.metadata.summary}</p>
          )}
        </div>
      )}

      <RichContent
        content={post.content}
        media={post.media}
        links={post.metadata.links}
        collapsed={isLong && !expanded}
      />

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <details className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-zinc-300">
            Author Metadata
          </summary>
          <div className="mt-3 space-y-2 text-xs text-zinc-300">
            <p>Pubkey: {post.author.pubkey}</p>
            {post.author.displayName && <p>Display name: {post.author.displayName}</p>}
            {post.author.name && <p>Name: {post.author.name}</p>}
            {post.author.website && (
              <p className="truncate">Website: {post.author.website}</p>
            )}
            {post.author.lud16 && <p>LUD16: {post.author.lud16}</p>}
            {post.author.lud06 && <p>LUD06: {post.author.lud06}</p>}
            {typeof post.author.bot === "boolean" && (
              <p>Bot: {String(post.author.bot)}</p>
            )}
            <pre className="max-h-44 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-[11px] leading-4 text-zinc-300">
              {JSON.stringify(post.author.raw ?? {}, null, 2)}
            </pre>
          </div>
        </details>

        <details className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-zinc-300">
            Post Metadata
          </summary>
          <div className="mt-3 space-y-2 text-xs text-zinc-300">
            <p>ID: {post.id}</p>
            <p>Created: {formatDateIso(post.createdAt)}</p>
            {post.metadata.client && <p>Client: {post.metadata.client}</p>}
            {post.metadata.hashtags.length > 0 && (
              <p>Hashtags: {post.metadata.hashtags.join(", ")}</p>
            )}
            <pre className="max-h-44 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-[11px] leading-4 text-zinc-300">
              {JSON.stringify(eventMetadata, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </article>
  );
}
