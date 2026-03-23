export type FeedSortMode = "newest" | "longest";

export type MediaKind = "image" | "video" | "audio";

export interface MediaAttachment {
  url: string;
  kind: MediaKind;
  source: "content" | "tag";
  mimeType?: string;
}

export interface NostrAuthorMetadata {
  pubkey: string;
  name?: string;
  displayName?: string;
  about?: string;
  picture?: string;
  banner?: string;
  website?: string;
  nip05?: string;
  lud16?: string;
  lud06?: string;
  bot?: boolean;
  raw?: Record<string, unknown>;
}

export interface NostrPostMetrics {
  zaps: number;
  reactions: number;
  reposts: number;
  replies: number;
}

export interface NostrPostMetadata {
  kind: number;
  sig: string;
  tags: string[][];
  hashtags: string[];
  links: string[];
  subject?: string;
  title?: string;
  summary?: string;
  client?: string;
}

export interface NostrPost {
  id: string;
  pubkey: string;
  content: string;
  createdAt: number;
  author: NostrAuthorMetadata;
  media: MediaAttachment[];
  metrics: NostrPostMetrics;
  metadata: NostrPostMetadata;
}

export interface FetchNostrPostsOptions {
  limit?: number;
  relays?: string[];
  maxWaitMs?: number;
}

export interface FetchNostrPostsResult {
  posts: NostrPost[];
  relayCount: number;
}
