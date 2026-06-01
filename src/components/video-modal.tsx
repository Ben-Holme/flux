"use client";

import { useEffect } from "react";
import styles from "./video-modal.module.css";

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
    <div className={styles.video}>
      <div className={styles.close} onClick={onClose} />
      <div className={styles.inner}>
        <iframe
          key={videoId}
          title={videoId}
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=1`}
          className={styles.iframe}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
        <div className={styles.thumbs}>
          {videos.map((item) => (
            <div
              key={item.id}
              className={`${styles.thumb}${videoId === item.id ? ` ${styles.thumbActive}` : ""}`}
              onClick={() => onSelect(item.id)}
            >
              <div
                className={styles.thumbImg}
                style={{
                  backgroundImage: `url('https://i.ytimg.com/vi/${item.id}/mqdefault.jpg')`,
                }}
              />
              <div className={styles.thumbLabel}>{item.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
