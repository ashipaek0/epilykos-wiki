"use client";

import { useState } from "react";

/**
 * A YouTube video that loads only when asked: until the visitor presses play, nothing is requested from
 * YouTube (no thumbnail either), so the page keeps the wiki's "nothing leaves your browser" promise.
 * Uses the youtube-nocookie.com embed. The link below the player works without JavaScript.
 */
export function YouTube({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const watch = `https://youtu.be/${id}`;
  return (
    <figure className="not-prose my-6">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-fd-card">
        {playing ? (
          <iframe
            className="absolute inset-0 size-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="absolute inset-0 flex size-full flex-col items-center justify-center gap-3 text-fd-foreground transition hover:bg-fd-accent/40"
            aria-label={`Play video: ${title}`}
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-fd-primary text-fd-primary-foreground">
              <svg viewBox="0 0 24 24" className="size-8" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="text-base font-medium">{title}</span>
            <span className="text-xs text-fd-muted-foreground">
              Loads from YouTube when you press play
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-2 text-sm text-fd-muted-foreground">
        <a href={watch} target="_blank" rel="noopener noreferrer" className="underline">
          Watch on YouTube
        </a>
      </figcaption>
    </figure>
  );
}
