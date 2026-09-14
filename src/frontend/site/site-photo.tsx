"use client";

import { cn } from "@/shared/utils";
import { useImageFallback } from "@/frontend/site/use-image-fallback";

/**
 * A photograph in the marketing site's frame: hard-edged, cropped to a fixed
 * ratio so nothing on the page moves while it loads.
 *
 * It is a client component for one reason — `onError`. The photographs live in
 * `public/` and are dropped in by hand, so a missing or misnamed file is a
 * realistic state; rather than show a broken-image icon this falls back to a
 * ruled olive panel that still reads as a deliberate block in the layout.
 *
 * A plain <img> rather than next/image: see the note in hero-object.tsx.
 */
export function SitePhoto({
  src,
  alt,
  width,
  height,
  ratio,
  className,
  priority = false,
}: {
  src: string;
  /** Empty string marks the image as decorative; give real alt text otherwise. */
  alt: string;
  width: number;
  height: number;
  /** CSS aspect-ratio for the frame, e.g. "4 / 3". Defaults to 16 / 9. */
  ratio?: string;
  className?: string;
  /** True for anything above the fold — skips lazy loading. */
  priority?: boolean;
}) {
  const image = useImageFallback();

  return (
    <div
      className={cn("photo", className)}
      style={ratio ? ({ ["--photo-ratio" as string]: ratio } as React.CSSProperties) : undefined}
    >
      {image.failed ? (
        <FramePlaceholder />
      ) : (
        /*
          next/image has no build-time pipeline on this project's Cloudflare
          target and falls back to an <img> there anyway; see hero-object.tsx.
        */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          decoding="async"
          loading={priority ? "eager" : "lazy"}
          {...image.props}
        />
      )}
    </div>
  );
}

/**
 * Stand-in for a photograph that has not been added yet: the same hairline
 * grid the rest of the system is built from, so an empty frame reads as part
 * of the design rather than as a failure.
 */
function FramePlaceholder() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 bg-panel"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(151,176,140,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(151,176,140,0.10) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    />
  );
}
