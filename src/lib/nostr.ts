import { SimplePool, type Event, type Filter } from "nostr-tools";
import type {
  FetchNostrPostsOptions,
  FetchNostrPostsResult,
  MediaAttachment,
  MediaKind,
  NostrAuthorMetadata,
  NostrPost,
  NostrPostMetrics,
} from "@/types/nostr";

export const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.primal.net",
  "wss://relay.nostr.band",
];

const KIND_PROFILE = 0;
const KIND_TEXT_NOTE = 1;
const KIND_REPOST = 6;
const KIND_GENERIC_REPOST = 16;
const KIND_REACTION = 7;
const KIND_ZAP_RECEIPT = 9735;

const DEFAULT_LIMIT = 20;
const DEFAULT_MAX_WAIT_MS = 4500;
const FETCH_WINDOW_SECONDS = 60 * 60 * 24 * 7;
const URL_REGEX = /\b((?:https?:\/\/|ipfs:\/\/)[^\s<>"'`]+)/gi;

type UrlCandidate = {
  url: string;
  source: "content" | "tag";
  mimeType?: string;
};

function sanitizeContent(content: string): string {
  // Keep plain text and strip null bytes/control chars that can break rendering.
  return content
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

function trimTrailingPunctuation(value: string): string {
  return value.replace(/[),.!?:;'"\]]+$/g, "");
}

function normalizeUrl(input: string | undefined): string | undefined {
  if (!input) {
    return undefined;
  }

  const trimmed = trimTrailingPunctuation(input.trim());
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith("ipfs://")) {
    const hash = trimmed
      .replace(/^ipfs:\/\//i, "")
      .replace(/^ipfs\//i, "")
      .replace(/^\/+/, "");

    if (!hash) {
      return undefined;
    }

    return `https://ipfs.io/ipfs/${hash}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function inferMediaKind(url: string, mimeType?: string): MediaKind | undefined {
  const lowerMime = mimeType?.toLowerCase();
  if (lowerMime?.startsWith("image/")) {
    return "image";
  }
  if (lowerMime?.startsWith("video/")) {
    return "video";
  }
  if (lowerMime?.startsWith("audio/")) {
    return "audio";
  }

  const lowerUrl = url.toLowerCase();

  if (
    /\.(apng|avif|bmp|gif|ico|jpe?g|png|svg|webp)(?:$|[?#])/i.test(lowerUrl)
  ) {
    return "image";
  }

  if (/\.(m3u8|m4v|mov|mp4|ogg|ogv|webm)(?:$|[?#])/i.test(lowerUrl)) {
    return "video";
  }

  if (/\.(aac|flac|m4a|mp3|oga|ogg|opus|wav)(?:$|[?#])/i.test(lowerUrl)) {
    return "audio";
  }

  return undefined;
}

function dedupeEvents(events: Event[]): Event[] {
  const unique = new Map<string, Event>();

  for (const event of events) {
    if (!unique.has(event.id)) {
      unique.set(event.id, event);
    }
  }

  return Array.from(unique.values());
}

function extractUrlsFromContent(content: string): UrlCandidate[] {
  const matches = content.match(URL_REGEX) ?? [];
  const candidates: UrlCandidate[] = [];

  for (const match of matches) {
    const normalized = normalizeUrl(match);
    if (!normalized) {
      continue;
    }

    candidates.push({ url: normalized, source: "content" });
  }

  return candidates;
}

function parseImetaTag(parts: string[]): UrlCandidate[] {
  let url: string | undefined;
  let mimeType: string | undefined;

  for (const part of parts) {
    const separator = part.indexOf(" ");
    if (separator === -1) {
      continue;
    }

    const key = part.slice(0, separator).trim().toLowerCase();
    const value = part.slice(separator + 1).trim();

    if (key === "url") {
      url = normalizeUrl(value);
    }

    if (key === "m") {
      mimeType = value;
    }
  }

  if (!url) {
    return [];
  }

  return [{ url, source: "tag", mimeType }];
}

function extractUrlsFromTags(tags: string[][]): UrlCandidate[] {
  const mediaLikeTags = new Set([
    "audio",
    "banner",
    "image",
    "photo",
    "poster",
    "preview",
    "r",
    "thumb",
    "url",
    "video",
  ]);

  const candidates: UrlCandidate[] = [];

  for (const tag of tags) {
    const [rawName, ...rest] = tag;
    const name = rawName?.toLowerCase();

    if (!name) {
      continue;
    }

    if (name === "imeta") {
      candidates.push(...parseImetaTag(rest));
      continue;
    }

    if (!mediaLikeTags.has(name)) {
      continue;
    }

    for (const value of rest) {
      const normalized = normalizeUrl(value);
      if (!normalized) {
        continue;
      }

      candidates.push({ url: normalized, source: "tag" });
    }
  }

  return candidates;
}

function getFirstTagValue(tags: string[][], name: string): string | undefined {
  for (const tag of tags) {
    if (tag[0]?.toLowerCase() === name) {
      return tag[1]?.trim() || undefined;
    }
  }

  return undefined;
}

function getHashtags(tags: string[][]): string[] {
  const hashtags = new Set<string>();

  for (const tag of tags) {
    if (tag[0]?.toLowerCase() !== "t") {
      continue;
    }

    const hashtag = tag[1]?.trim();
    if (!hashtag) {
      continue;
    }

    hashtags.add(hashtag);
  }

  return Array.from(hashtags);
}

function getNumericTagValue(tags: string[][], names: string[]): number | undefined {
  const nameSet = new Set(names.map((name) => name.toLowerCase()));

  for (const tag of tags) {
    const key = tag[0]?.toLowerCase();
    if (!key || !nameSet.has(key)) {
      continue;
    }

    const parsed = Number(tag[1]);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return undefined;
}

function createEmptyMetrics(): NostrPostMetrics {
  return {
    zaps: 0,
    reactions: 0,
    reposts: 0,
    replies: 0,
  };
}

function buildDefaultAuthor(pubkey: string): NostrAuthorMetadata {
  return { pubkey };
}

function isValidTextNote(event: Event): boolean {
  return event.kind === KIND_TEXT_NOTE && sanitizeContent(event.content).length > 0;
}

function parseProfileRecord(content: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }

  return {};
}

function readString(
  record: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
}

function readBoolean(
  record: Record<string, unknown>,
  keys: string[],
): boolean | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true") {
        return true;
      }

      if (normalized === "false") {
        return false;
      }
    }
  }

  return undefined;
}

function parseProfileEvent(event: Event): NostrAuthorMetadata {
  const raw = parseProfileRecord(event.content);
  const picture = normalizeUrl(readString(raw, ["picture"]));
  const banner = normalizeUrl(readString(raw, ["banner"]));
  const website = normalizeUrl(readString(raw, ["website"]));

  return {
    pubkey: event.pubkey,
    name: readString(raw, ["name", "username"]),
    displayName: readString(raw, ["display_name", "displayName"]),
    about: readString(raw, ["about"]),
    picture,
    banner,
    website,
    nip05: readString(raw, ["nip05"]),
    lud16: readString(raw, ["lud16"]),
    lud06: readString(raw, ["lud06"]),
    bot: readBoolean(raw, ["bot"]),
    raw,
  };
}

async function queryFilterAcrossRelays(
  pool: SimplePool,
  relays: string[],
  filter: Filter,
  maxWaitMs: number,
): Promise<{ events: Event[]; successfulRelayCount: number }> {
  const relayRequests = relays.map((relay) =>
    pool.querySync([relay], filter, { maxWait: maxWaitMs }),
  );

  const results = await Promise.allSettled(relayRequests);
  const events: Event[] = [];
  let successfulRelayCount = 0;

  for (const result of results) {
    if (result.status === "fulfilled") {
      successfulRelayCount += 1;
      events.push(...result.value);
    }
  }

  return {
    events: dedupeEvents(events),
    successfulRelayCount,
  };
}

async function fetchAuthorMetadata(
  pool: SimplePool,
  relays: string[],
  pubkeys: string[],
  maxWaitMs: number,
): Promise<Map<string, NostrAuthorMetadata>> {
  const authors = new Map<string, NostrAuthorMetadata>();
  for (const pubkey of pubkeys) {
    authors.set(pubkey, buildDefaultAuthor(pubkey));
  }

  if (pubkeys.length === 0) {
    return authors;
  }

  const profileFilter: Filter = {
    kinds: [KIND_PROFILE],
    authors: pubkeys,
    limit: Math.max(pubkeys.length * 5, 40),
  };

  const { events } = await queryFilterAcrossRelays(
    pool,
    relays,
    profileFilter,
    maxWaitMs,
  );

  const latestByPubkey = new Map<string, Event>();

  for (const event of events) {
    const previous = latestByPubkey.get(event.pubkey);
    if (!previous || event.created_at > previous.created_at) {
      latestByPubkey.set(event.pubkey, event);
    }
  }

  for (const [pubkey, event] of latestByPubkey.entries()) {
    authors.set(pubkey, parseProfileEvent(event));
  }

  return authors;
}

function pickReferencedEventId(
  tags: string[][],
  validPostIds: Set<string>,
): string | undefined {
  let firstMatch: string | undefined;
  let replyMatch: string | undefined;
  let rootMatch: string | undefined;

  for (const tag of tags) {
    if (tag[0]?.toLowerCase() !== "e") {
      continue;
    }

    const eventId = tag[1]?.toLowerCase();
    if (!eventId || !validPostIds.has(eventId)) {
      continue;
    }

    const marker = (tag[3] ?? "").toLowerCase();
    if (marker === "root") {
      rootMatch = eventId;
      continue;
    }

    if (marker === "reply") {
      replyMatch = eventId;
      continue;
    }

    if (!firstMatch) {
      firstMatch = eventId;
    }
  }

  return replyMatch ?? rootMatch ?? firstMatch;
}

async function fetchPostMetrics(
  pool: SimplePool,
  relays: string[],
  posts: Event[],
  maxWaitMs: number,
): Promise<Map<string, NostrPostMetrics>> {
  const metricsByPostId = new Map<string, NostrPostMetrics>();
  const postIds = posts.map((post) => post.id);
  const normalizedPostIdLookup = new Map<string, string>();

  for (const postId of postIds) {
    normalizedPostIdLookup.set(postId.toLowerCase(), postId);
    metricsByPostId.set(postId, createEmptyMetrics());
  }

  if (postIds.length === 0) {
    return metricsByPostId;
  }

  const oldestPostTimestamp = posts.reduce(
    (oldest, event) => Math.min(oldest, event.created_at),
    posts[0]?.created_at ?? Math.floor(Date.now() / 1000),
  );

  const since = Math.max(oldestPostTimestamp - 60 * 60 * 24, 0);
  const kindsForMetrics = [
    KIND_TEXT_NOTE,
    KIND_REPOST,
    KIND_GENERIC_REPOST,
    KIND_REACTION,
    KIND_ZAP_RECEIPT,
  ];

  const referencedFilter: Filter = {
    kinds: kindsForMetrics,
    "#e": postIds,
    limit: Math.max(postIds.length * 400, 2000),
  };

  const requests = relays.map((relay) =>
    pool.querySync([relay], referencedFilter, {
      maxWait: Math.max(maxWaitMs * 3, 15000),
    }),
  );

  const results = await Promise.allSettled(requests);
  const relatedEvents: Event[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      relatedEvents.push(...result.value);
    }
  }

  let uniqueRelatedEvents = dedupeEvents(relatedEvents);
  const normalizedPostIds = new Set(
    postIds.map((postId) => postId.toLowerCase()),
  );

  if (uniqueRelatedEvents.length === 0) {
    // Fallback for relays that ignore #e filters: fetch a wider set and filter locally.
    const fallbackFilter: Filter = {
      kinds: kindsForMetrics,
      since,
      limit: Math.max(postIds.length * 450, 2400),
    };

    const fallbackRequests = relays.map((relay) =>
      pool.querySync([relay], fallbackFilter, {
        maxWait: Math.max(maxWaitMs * 3, 15000),
      }),
    );

    const fallbackResults = await Promise.allSettled(fallbackRequests);
    const fallbackEvents: Event[] = [];

    for (const result of fallbackResults) {
      if (result.status === "fulfilled") {
        fallbackEvents.push(...result.value);
      }
    }

    uniqueRelatedEvents = dedupeEvents(fallbackEvents);
  }

  for (const event of uniqueRelatedEvents) {
    const targetNormalizedPostId = pickReferencedEventId(
      event.tags,
      normalizedPostIds,
    );

    if (!targetNormalizedPostId) {
      continue;
    }

    const targetPostId = normalizedPostIdLookup.get(targetNormalizedPostId);
    if (!targetPostId) {
      continue;
    }

    const current = metricsByPostId.get(targetPostId) ?? createEmptyMetrics();

    if (event.kind === KIND_REACTION) {
      current.reactions += 1;
    } else if (event.kind === KIND_REPOST || event.kind === KIND_GENERIC_REPOST) {
      current.reposts += 1;
    } else if (event.kind === KIND_ZAP_RECEIPT) {
      current.zaps += 1;
    } else if (event.kind === KIND_TEXT_NOTE) {
      current.replies += 1;
    }

    metricsByPostId.set(targetPostId, current);
  }

  return metricsByPostId;
}

function extractMediaAndLinks(content: string, tags: string[][]): {
  media: MediaAttachment[];
  links: string[];
} {
  const urlCandidates = [
    ...extractUrlsFromContent(content),
    ...extractUrlsFromTags(tags),
  ];

  const uniqueCandidates = new Map<string, UrlCandidate>();
  for (const candidate of urlCandidates) {
    if (!uniqueCandidates.has(candidate.url)) {
      uniqueCandidates.set(candidate.url, candidate);
    }
  }

  const media: MediaAttachment[] = [];
  const links: string[] = [];

  for (const candidate of uniqueCandidates.values()) {
    const mediaKind = inferMediaKind(candidate.url, candidate.mimeType);
    if (mediaKind) {
      media.push({
        url: candidate.url,
        kind: mediaKind,
        source: candidate.source,
        mimeType: candidate.mimeType,
      });
    }

    links.push(candidate.url);
  }

  return {
    media: media.slice(0, 12),
    links: links.slice(0, 20),
  };
}

function toPost(
  event: Event,
  author: NostrAuthorMetadata,
  metrics: NostrPostMetrics,
): NostrPost {
  const content = sanitizeContent(event.content);
  const { media, links } = extractMediaAndLinks(content, event.tags);
  const metricsFromTags = {
    replies: getNumericTagValue(event.tags, ["replies", "reply_count"]),
    reposts: getNumericTagValue(event.tags, ["reposts", "repost_count"]),
    reactions: getNumericTagValue(event.tags, ["reactions", "reaction_count"]),
    zaps: getNumericTagValue(event.tags, ["zaps", "zap", "zap_count"]),
  };

  const mergedMetrics: NostrPostMetrics = {
    replies: Math.max(metrics.replies, metricsFromTags.replies ?? 0),
    reposts: Math.max(metrics.reposts, metricsFromTags.reposts ?? 0),
    reactions: Math.max(metrics.reactions, metricsFromTags.reactions ?? 0),
    zaps: Math.max(metrics.zaps, metricsFromTags.zaps ?? 0),
  };

  return {
    id: event.id,
    pubkey: event.pubkey,
    content,
    createdAt: event.created_at,
    author,
    media,
    metrics: mergedMetrics,
    metadata: {
      kind: event.kind,
      sig: event.sig,
      tags: event.tags,
      hashtags: getHashtags(event.tags),
      links,
      subject: getFirstTagValue(event.tags, "subject"),
      title: getFirstTagValue(event.tags, "title"),
      summary: getFirstTagValue(event.tags, "summary"),
      client: getFirstTagValue(event.tags, "client"),
    },
  };
}

export async function fetchRecentTextNotes(
  options: FetchNostrPostsOptions = {},
): Promise<FetchNostrPostsResult> {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const relays = options.relays ?? DEFAULT_RELAYS;
  const maxWaitMs = options.maxWaitMs ?? DEFAULT_MAX_WAIT_MS;

  const now = Math.floor(Date.now() / 1000);
  const notesFilter: Filter = {
    kinds: [KIND_TEXT_NOTE],
    since: now - FETCH_WINDOW_SECONDS,
    limit: Math.max(limit * 5, 80),
  };

  const pool = new SimplePool({ enablePing: true, enableReconnect: false });

  try {
    const {
      events: recentEvents,
      successfulRelayCount,
    } = await queryFilterAcrossRelays(pool, relays, notesFilter, maxWaitMs);

    if (successfulRelayCount === 0) {
      throw new Error("Unable to read from public relays right now.");
    }

    const recentTextNotes = recentEvents
      .filter(isValidTextNote)
      .sort((a, b) => b.created_at - a.created_at || a.id.localeCompare(b.id))
      .slice(0, limit);

    const pubkeys = Array.from(
      new Set(recentTextNotes.map((event) => event.pubkey)),
    );

    const [authors, metricsByPostId] = await Promise.all([
      fetchAuthorMetadata(pool, relays, pubkeys, maxWaitMs),
      fetchPostMetrics(pool, relays, recentTextNotes, maxWaitMs),
    ]);

    const posts = recentTextNotes.map((event) =>
      toPost(
        event,
        authors.get(event.pubkey) ?? buildDefaultAuthor(event.pubkey),
        metricsByPostId.get(event.id) ?? createEmptyMetrics(),
      ),
    );

    return {
      posts,
      relayCount: successfulRelayCount,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected relay error.";
    throw new Error(message);
  } finally {
    pool.close(relays);
    pool.destroy();
  }
}
