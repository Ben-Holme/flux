"use client";

import { useRef } from "react";

interface StripImage {
  url: string;
  alt?: string;
}

export function ImageStrip({ images }: { images: StripImage[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!ref.current) return;
    dragging.current = true;
    startX.current = e.pageX - ref.current.offsetLeft;
    scrollLeft.current = ref.current.scrollLeft;
    ref.current.style.cursor = "grabbing";
  };
  const onMouseLeave = () => {
    dragging.current = false;
    if (ref.current) ref.current.style.cursor = "grab";
  };
  const onMouseUp = () => {
    dragging.current = false;
    if (ref.current) ref.current.style.cursor = "grab";
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    ref.current.scrollLeft = scrollLeft.current - (x - startX.current);
  };

  return (
    <div
      ref={ref}
      className="flex gap-2 overflow-x-auto"
      style={{ cursor: "grab", scrollbarWidth: "none" }}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
    >
      {images.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={img.url}
          alt={img.alt ?? ""}
          draggable={false}
          className="h-[180px] w-auto shrink-0 rounded object-cover"
        />
      ))}
    </div>
  );
}
