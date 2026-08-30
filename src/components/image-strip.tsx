"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface StripImage {
  url: string;
  alt?: string;
}

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const SPEED = 0.4; // px per frame

export function ImageStrip({ images }: { images: StripImage[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef<number>(0);
  const paused = useRef(false);
  const dragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const didDrag = useRef(false);

  const [lightbox, setLightbox] = useState<number | null>(null);

  // Auto-scroll loop — duplicated images make it seamless
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tick = () => {
      if (!paused.current && el) {
        el.scrollLeft += SPEED;
        // When we've scrolled past the first copy, reset silently
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft -= el.scrollWidth / 2;
        }
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const prev = useCallback(() => setLightbox((i) => (i != null ? (i - 1 + images.length) % images.length : null)), [images.length]);
  const next = useCallback(() => setLightbox((i) => (i != null ? (i + 1) % images.length : null)), [images.length]);

  useEffect(() => {
    if (lightbox == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, prev, next]);

  useEffect(() => {
    document.body.style.overflow = lightbox != null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!ref.current) return;
    paused.current = true;
    dragging.current = true;
    didDrag.current = false;
    startX.current = e.pageX - ref.current.offsetLeft;
    scrollLeft.current = ref.current.scrollLeft;
    ref.current.style.cursor = "grabbing";
  };
  const onMouseLeave = () => {
    dragging.current = false;
    paused.current = false;
    if (ref.current) ref.current.style.cursor = "grab";
  };
  const onMouseUp = () => {
    dragging.current = false;
    paused.current = false;
    if (ref.current) ref.current.style.cursor = "grab";
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const delta = x - startX.current;
    if (Math.abs(delta) > 4) didDrag.current = true;
    ref.current.scrollLeft = scrollLeft.current - delta;
  };

  const current = lightbox != null ? images[lightbox] : null;

  return (
    <>
      <div
        className="bg-black py-6"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        }}
      >
      {/* Wrapper clips the scrollbar while allowing JS scrollLeft */}
      <div className="overflow-hidden">
      <div
        ref={ref}
        className="flex gap-2 overflow-x-scroll pb-3 -mb-3"
        style={{ cursor: "grab", scrollbarWidth: "none" }}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
      >
        {/* Render twice for seamless loop */}
        {[...images, ...images].map((img, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={img.url}
            alt={img.alt ?? ""}
            draggable={false}
            onClick={() => { if (!didDrag.current) setLightbox(i % images.length); }}
            className="h-[80px] w-auto shrink-0 cursor-pointer rounded object-cover transition-opacity hover:opacity-85"
          />
        ))}
      </div>
      </div>
      </div>

      {lightbox != null && current && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.url} alt={current.alt ?? ""} className="max-h-[85vh] w-full rounded-lg object-contain" />

            <button
              className="bg-void hover:bg-surface absolute -top-3 -right-3 rounded-full border border-white/10 p-2 text-white transition-colors"
              onClick={() => setLightbox(null)}
              aria-label="Close"
            >
              <XIcon />
            </button>

            {images.length > 1 && (
              <>
                <button
                  className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
                  onClick={prev}
                  aria-label="Previous"
                >
                  <ChevronLeft />
                </button>
                <button
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
                  onClick={next}
                  aria-label="Next"
                >
                  <ChevronRight />
                </button>
              </>
            )}

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
              {lightbox + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
