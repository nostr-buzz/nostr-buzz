/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MediaAttachment } from "@/types/nostr";

interface RichContentProps {
  content: string;
  media: MediaAttachment[];
  links: string[];
  collapsed?: boolean;
}

function normalizeRenderableUrl(value: string): string | undefined {
  if (value.startsWith("ipfs://")) {
    const hash = value
      .replace(/^ipfs:\/\//i, "")
      .replace(/^ipfs\//i, "")
      .replace(/^\/+/, "");

    if (hash) {
      return `https://ipfs.io/ipfs/${hash}`;
    }

    return undefined;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function extractMarkdownImageUrls(content: string): Set<string> {
  const imageRegex = /!\[[^\]]*]\(([^)]+)\)/g;
  const urls = new Set<string>();
  let match: RegExpExecArray | null = imageRegex.exec(content);

  while (match) {
    const normalized = normalizeRenderableUrl(match[1]);
    if (normalized) {
      urls.add(normalized);
    }
    match = imageRegex.exec(content);
  }

  return urls;
}

export function RichContent({
  content,
  media,
  links,
  collapsed = false,
}: RichContentProps) {
  const markdownImageUrls = useMemo(
    () => extractMarkdownImageUrls(content),
    [content],
  );

  const visibleMedia = useMemo(
    () => media.filter((item) => !markdownImageUrls.has(item.url)),
    [media, markdownImageUrls],
  );

  const mediaUrls = useMemo(
    () => new Set(visibleMedia.map((item) => item.url)),
    [visibleMedia],
  );

  const imageMedia = visibleMedia.filter((item) => item.kind === "image");
  const videoMedia = visibleMedia.filter((item) => item.kind === "video");
  const audioMedia = visibleMedia.filter((item) => item.kind === "audio");
  const nonMediaLinks = links.filter((link) => !mediaUrls.has(link));

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className={collapsed ? "max-h-44 overflow-hidden" : undefined}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a({ href, children }) {
                const safeHref = href ? normalizeRenderableUrl(href) : undefined;
                if (!safeHref) {
                  return <span className="text-zinc-300">{children}</span>;
                }

                return (
                  <a
                    href={safeHref}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-zinc-200 underline decoration-zinc-500 underline-offset-2 transition-colors hover:text-white"
                  >
                    {children}
                  </a>
                );
              },
              img({ src, alt }) {
                const safeSrc =
                  typeof src === "string"
                    ? normalizeRenderableUrl(src)
                    : undefined;
                if (!safeSrc) {
                  return null;
                }

                return (
                  <img
                    src={safeSrc}
                    alt={alt ?? "Post image"}
                    loading="lazy"
                    className="my-3 w-full rounded-xl border border-zinc-800 object-cover"
                  />
                );
              },
              p({ children }) {
                return (
                  <p className="my-2 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-100 sm:text-base">
                    {children}
                  </p>
                );
              },
              code({ children }) {
                return (
                  <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-xs text-zinc-200">
                    {children}
                  </code>
                );
              },
              pre({ children }) {
                return (
                  <pre className="my-3 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-100">
                    {children}
                  </pre>
                );
              },
              blockquote({ children }) {
                return (
                  <blockquote className="my-3 border-l-2 border-zinc-700 pl-3 text-zinc-300">
                    {children}
                  </blockquote>
                );
              },
              ul({ children }) {
                return <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>;
              },
              ol({ children }) {
                return (
                  <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
                );
              },
              li({ children }) {
                return <li className="text-sm text-zinc-200">{children}</li>;
              },
              table({ children }) {
                return (
                  <div className="my-3 overflow-x-auto rounded-lg border border-zinc-800">
                    <table className="min-w-full border-collapse text-left text-xs text-zinc-200">
                      {children}
                    </table>
                  </div>
                );
              },
              th({ children }) {
                return (
                  <th className="border-b border-zinc-800 bg-zinc-900 px-3 py-2 font-semibold">
                    {children}
                  </th>
                );
              },
              td({ children }) {
                return <td className="border-b border-zinc-900 px-3 py-2">{children}</td>;
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {collapsed && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-transparent" />
        )}
      </div>

      {imageMedia.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Images
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {imageMedia.map((item) => (
              <img
                key={item.url}
                src={item.url}
                alt="Attached media"
                loading="lazy"
                className="w-full rounded-xl border border-zinc-800 object-cover"
              />
            ))}
          </div>
        </section>
      )}

      {videoMedia.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Videos
          </p>
          <div className="space-y-3">
            {videoMedia.map((item) => (
              <video
                key={item.url}
                controls
                preload="metadata"
                className="w-full rounded-xl border border-zinc-800 bg-black"
                src={item.url}
              />
            ))}
          </div>
        </section>
      )}

      {audioMedia.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Audio
          </p>
          <div className="space-y-2">
            {audioMedia.map((item) => (
              <audio
                key={item.url}
                controls
                preload="metadata"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950"
                src={item.url}
              />
            ))}
          </div>
        </section>
      )}

      {nonMediaLinks.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Links
          </p>
          <ul className="space-y-1">
            {nonMediaLinks.map((link) => (
              <li key={link} className="min-w-0">
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="block truncate text-sm text-zinc-300 underline decoration-zinc-600 underline-offset-2 transition-colors hover:text-white"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
