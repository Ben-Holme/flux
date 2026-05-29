"use client";

import { useEffect } from "react";

interface Video {
  name: string;
  id: string;
}

interface VideoModalProps {
  isOpen: boolean;
  videoId: string;
  videos: Video[];
  onClose: () => void;
  onSelect: (id: string) => void;
}

export default function VideoModal({
  isOpen,
  videoId,
  videos,
  onClose,
  onSelect,
}: VideoModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <button
        onClick={onClose}
        className="absolute right-4 top-4 text-white/50 hover:text-white"
        aria-label="Close video"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 6L6 18M6 6l12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div className="w-full max-w-4xl">
        <div className="relative aspect-video w-full bg-black">
          <iframe
            key={videoId}
            title={videoId}
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=1`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>

        <div className="mt-4 flex gap-4">
          {videos.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex flex-col overflow-hidden border transition-colors ${
                videoId === item.id ? "border-gold" : "border-white/20 hover:border-white/50"
              }`}
            >
              <div
                className="h-20 w-36 bg-cover bg-center"
                style={{
                  backgroundImage: `url('https://i.ytimg.com/vi/${item.id}/mqdefault.jpg')`,
                }}
              />
              <span className="px-2 py-1 text-left text-xs font-heading tracking-wider text-white/70">
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
