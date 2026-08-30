interface SectionImageProps {
  src: string;
  alt?: string;
  /** CSS left offset — how far from the left edge the image panel starts. Default: "42%" */
  from?: string;
  /** Gradient fade stop — how much of the panel width fades in. Default: "28%" */
  fade?: string;
  /** Vertical focal point — Y component of object-position, e.g. "10%" shows near the top. Default: "50%" */
  focalY?: string;
}

export function SectionImage({
  src,
  alt = "",
  from = "42%",
  fade = "28%",
  focalY = "50%",
}: SectionImageProps) {
  return (
    <div
      className="pointer-events-none absolute top-0 right-0 bottom-0 max-[768px]:hidden"
      style={{
        left: from,
        maskImage: `linear-gradient(to right, transparent, black ${fade})`,
        WebkitMaskImage: `linear-gradient(to right, transparent, black ${fade})`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${focalY}` }}
      />
    </div>
  );
}
