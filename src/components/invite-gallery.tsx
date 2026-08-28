"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface GalleryImage {
  url: string;
  alt: string;
  slug?: string;
}

const ChevronLeft = ({ large }: { large?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={large ? "h-6 w-6" : "h-4 w-4"}
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRight = ({ large }: { large?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={large ? "h-6 w-6" : "h-4 w-4"}
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const ExpandIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export function InviteGallery({ images }: { images: GalleryImage[] }) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + images.length) % images.length),
    [images.length],
  );
  const next = useCallback(
    () => setCurrent((c) => (c + 1) % images.length),
    [images.length],
  );

  // Auto-advance when lightbox is closed
  useEffect(() => {
    if (lightbox || images.length <= 1) return;
    const t = setInterval(next, 4500);
    return () => clearInterval(t);
  }, [lightbox, next, images.length]);

  // Keyboard nav for lightbox
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, prev, next]);

  // Prevent body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightbox ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  if (images.length === 0) return null;

  const img = images[current];

  return (
    <>
      {/* ── Slideshow ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div
          className="group relative cursor-pointer overflow-hidden rounded-lg"
          onClick={() => setLightbox(true)}
        >
          <img
            src={img.url}
            alt={img.alt}
            className="aspect-video w-full object-cover transition-opacity duration-300 group-hover:opacity-85"
          />

          {/* Expand hint */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
            <div className="rounded-full bg-black/55 p-3 text-white">
              <ExpandIcon />
            </div>
          </div>

          {/* Prev / next */}
          {images.length > 1 && (
            <>
              <button
                className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Previous image"
              >
                <ChevronLeft />
              </button>
              <button
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Next image"
              >
                <ChevronRight />
              </button>
            </>
          )}
        </div>

        {/* Dots + devlog link row */}
        <div className="flex items-center justify-between px-1">
          {images.length > 1 ? (
            <div className="flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === current ? "w-5 bg-gold" : "w-1.5 bg-white/25 hover:bg-white/45"
                  }`}
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          ) : <span />}
          {img.slug && (
            <Link
              href={`/devlog/${img.slug}`}
              className="text-xs text-ash transition-colors hover:text-parchment"
            >
              View in devlog →
            </Link>
          )}
        </div>
      </div>

      {/* ── Lightbox ──────────────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={img.url}
              alt={img.alt}
              className="max-h-[85vh] w-full rounded-lg object-contain"
            />

            {/* Close */}
            <button
              className="absolute -top-3 -right-3 rounded-full border border-white/10 bg-void p-2 text-white transition-colors hover:bg-surface"
              onClick={() => setLightbox(false)}
              aria-label="Close"
            >
              <XIcon />
            </button>

            {/* Prev / next in lightbox */}
            {images.length > 1 && (
              <>
                <button
                  className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
                  onClick={prev}
                  aria-label="Previous image"
                >
                  <ChevronLeft large />
                </button>
                <button
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
                  onClick={next}
                  aria-label="Next image"
                >
                  <ChevronRight large />
                </button>
              </>
            )}

            {/* Counter */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
              {current + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
