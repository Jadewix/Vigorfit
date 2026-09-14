"use client";

import { useEffect, useRef } from "react";
import { useImageFallback } from "@/frontend/site/use-image-fallback";

/**
 * HeroObject — the hero's floating weight, and the one piece of motion on the
 * page that responds to scrolling.
 *
 * Layout. On phones the object sits *behind* the type across the full hero, at
 * low opacity, so the headline always wins; from `lg` it moves into its own
 * column starting past where the text column ends (`lg:left-[62%]`), and comes
 * up to full strength. Both treatments come from `.hero-object` in globals.css.
 *
 * Motion. The scroll handler writes exactly one number — `--par`, 0 at the top
 * of the page and 1 once the hero has scrolled away — and every visible effect
 * is derived from it in CSS (`.parallax` for the drift, `.hero-object` for the
 * fade). That split is deliberate: `prefers-reduced-motion` switches the whole
 * effect off in the stylesheet, and this component needs no branch for it
 * beyond declining to start the listener.
 *
 * Asset. `src` is expected to be a *transparent* PNG/WebP cut-out — the bloom
 * and contact shadow below only seat the object on the olive if the file has
 * no background of its own. Until that file exists the component falls back to
 * the wireframe plate, so a missing asset degrades to a deliberate graphic
 * rather than a broken image icon.
 *
 * The object is decorative: the layer is aria-hidden and never intercepts
 * pointer events aimed at the hero's buttons behind it.
 */
export function HeroObject({
  src,
  width,
  height,
  className,
  style,
}: {
  /** Transparent cut-out. Omit (or let it 404) to render the plate instead. */
  src?: string;
  /** The file's intrinsic pixel size; it is what shapes the box. */
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const image = useImageFallback();
  const showImage = Boolean(src) && !image.failed;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion is honoured by not running at all. The CSS also nulls the
    // transform, so the two agree even if this check were ever missed.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Measure against the hero section rather than the viewport height: the
    // hero is `min-h-[100svh]` but grows taller than that whenever the copy
    // needs it, and a viewport-height assumption would finish the animation
    // early on small phones in landscape.
    const section = el.closest("section");
    if (!section) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const { top, height } = section.getBoundingClientRect();
      const progress = Math.min(Math.max(-top / Math.max(height, 1), 0), 1);
      el.style.setProperty("--par", progress.toFixed(4));
    };
    const onScroll = () => {
      // Coalesce to one write per frame; scroll fires far more often than that.
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={[
        "hero-object parallax pointer-events-none absolute z-0 grid place-items-center",
        "inset-0",
        "lg:inset-y-0 lg:left-[62%] lg:right-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        // Defaults the caller can override, so nudging the render later is a
        // one-line change in the hero rather than a rewrite of this file.
        ["--ho-x" as string]: "0%",
        ["--ho-y" as string]: "0%",
        ["--ho-scale" as string]: "1",
        ...style,
      }}
    >
      {/*
        The box takes its aspect ratio from the asset rather than assuming one.
        A dumbbell photographed lying down is wide, and forcing it into a square
        would letterbox it — the object would render smaller than its column
        allows, with dead space above and below that the bloom still lights.

        The placeholder falls back to square, because the wireframe plate it
        draws is a set of concentric circles and only reads correctly in one.
      */}
      <div
        className="relative w-[min(84%,30rem)]"
        style={{
          aspectRatio: showImage && width && height ? `${width} / ${height}` : "1 / 1",
          transform:
            "translate(var(--ho-x), var(--ho-y)) scale(var(--ho-scale))",
        }}
      >
        {/*
          Light bloom. This stays once a render is dropped in: it is what seats
          the object on the olive ground instead of leaving it floating as a
          cut-out.
        */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 42% 38%, rgba(151,176,140,0.20), rgba(151,176,140,0.05) 45%, transparent 68%)",
          }}
        />

        {showImage ? (
          /*
            A plain <img>, not next/image. This project deploys to Cloudflare
            Workers through vinext, where next/image has no build-time pipeline
            and renders an <img> with a srcSet anyway; with a single fixed-size
            local asset that buys nothing and costs a dependency on an
            optimizer that is not configured here.

            Eager, and not lazy-loaded: it is above the fold on every screen.
          */
          // eslint-disable-next-line @next/next/no-img-element -- see above
          <img
            src={src}
            alt=""
            width={width}
            height={height}
            decoding="async"
            className="absolute inset-0 h-full w-full object-contain"
            {...image.props}
          />
        ) : (
          <PlatePlaceholder />
        )}

        {/*
          Contact shadow, sitting below the object's base. A render with a
          transparent background reads as genuinely resting on the page with
          this behind it, and as a sticker without it.
        */}
        <div
          className="absolute bottom-[6%] left-1/2 h-[7%] w-[62%] -translate-x-1/2 rounded-[50%] blur-md"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(11,13,11,0.55), transparent 72%)",
          }}
        />
      </div>
    </div>
  );
}

/**
 * Wireframe weight plate, drawn in CSS so it costs no request and no
 * dependency. Stands in whenever the real cut-out is absent or fails to load.
 */
function PlatePlaceholder() {
  // Ring diameters as a share of the layer, outermost first, each with the
  // alpha it carries. Concentric circles of falling opacity give the plate
  // depth without shading it.
  const rings: [number, number][] = [
    [100, 0.5],
    [82, 0.34],
    [64, 0.24],
    [46, 0.18],
    [28, 0.14],
  ];

  return (
    <div className="absolute inset-0">
      {rings.map(([size, alpha]) => (
        <div
          key={size}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            width: `${size}%`,
            height: `${size}%`,
            borderColor: `rgba(151,176,140,${alpha})`,
          }}
        />
      ))}

      {/* Centre hub — the plate's bore, and the one solid mark in the group. */}
      <div
        className="absolute left-1/2 top-1/2 h-[11%] w-[11%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "rgba(151,176,140,0.22)" }}
      />

      {/* Crosshair ticks, so the plate reads as a measured object. */}
      <div
        className="absolute left-1/2 top-1/2 h-px w-[100%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(151,176,140,0.18) 18%, rgba(151,176,140,0.18) 82%, transparent)",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[100%] w-px -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(151,176,140,0.18) 18%, rgba(151,176,140,0.18) 82%, transparent)",
        }}
      />
    </div>
  );
}
