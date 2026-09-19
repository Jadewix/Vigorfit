"use client";

import { useEffect, useRef, useState } from "react";
import type { MarkScene } from "@/frontend/site/hero-mark-scene";

/**
 * The studio's STL of the mark, gzipped for the wire by
 * scripts/hero-mark/compress.mjs (2.2 MB → 350 KB). Unzipped, it is the file
 * they sent byte for byte; nothing about the model is converted.
 */
const MODEL_URL = "/hero-mark.stl.gz";

/**
 * Fetch the model and undo the gzip. The magic-number check is there because
 * whether a `.gz` arrives still zipped depends on the server: a static host
 * that labels it `Content-Encoding: gzip` has the browser unzip it on the
 * way in, and unzipping twice would fail.
 */
async function loadModel(): Promise<ArrayBuffer> {
  const res = await fetch(MODEL_URL);
  if (!res.ok) throw new Error(`${MODEL_URL}: ${res.status}`);
  const bytes = await res.arrayBuffer();
  const head = new Uint8Array(bytes, 0, 2);
  if (head[0] !== 0x1f || head[1] !== 0x8b) return bytes;
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).arrayBuffer();
}

/**
 * The angle the mark rests at with the page at the top: face-on, as the
 * model was drawn, so the top of the page shows the file as it is.
 */
const REST_YAW = 0;

/** How far it turns while the hero scrolls away: one full turn. */
const TURN = Math.PI * 2;

/**
 * How quickly the drawn angle catches up with the scroll, as a time
 * constant in ms. A wheel moves the page in 100px jumps, which is a 40° jump
 * in the angle; easing over a few frames turns that into a turn rather than
 * a cut, and it is short enough that the mark still feels fixed to the page.
 */
const LAG_MS = 90;

/**
 * HeroMark — the Vigorfit mark in 3D, behind the hero, turning as the page
 * scrolls. Scrolling down turns it one way and scrolling back up turns it
 * back, because the angle is a function of the scroll position rather than
 * a spin that scrolling sets off: the same point on the page always shows
 * the same angle.
 *
 * Unlike the dumbbell in the team band, which is a still image, this one is
 * drawn live. A turn that follows the scroll needs every angle, and a
 * prerendered flipbook smooth enough to pass for that is heavier to download
 * and far heavier in memory than three.js plus the model. What keeps it cheap:
 *
 * - three.js and the model load after the page is up, via `import()`, and the
 *   canvas fades in once the first frame exists. Until then, or if WebGL is
 *   missing, the hero is exactly what it was without it.
 * - It draws on demand. Nothing runs while the page is still; a scroll
 *   draws a handful of frames while the angle settles and then stops. Once
 *   the hero has scrolled away the angle stops changing, so nothing draws.
 *
 * Placement, opacity and drift follow HeroObject: the layer fills the box it
 * is given and the caller moves it, and it reuses `.hero-object` (a fifth of
 * its strength behind the type on phones, full from `lg`) and `.parallax`
 * (the downward drift), both driven by the same `--par` written here.
 * `prefers-reduced-motion` gets the mark at rest and no scroll handler.
 *
 * Decorative: aria-hidden, and never in the way of a tap on the hero.
 */
export function HeroMark({ className }: { className?: string }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const layer = layerRef.current;
    const canvas = canvasRef.current;
    const section = layer?.closest("section");
    if (!layer || !canvas || !section) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let scene: MarkScene | null = null;
    let disposed = false;
    let frame = 0;
    let last = 0;
    // `shown` is the progress the mark is drawn at and chases the scroll;
    // `drawnAt` is what is on the canvas, so a frame that would change
    // nothing is skipped. NaN forces the next draw.
    let shown = 0;
    let drawnAt = NaN;

    // 0 with the hero at the top, 1 once it has scrolled fully away. Measured
    // against the section, not the viewport, for the reason HeroObject gives.
    const progress = () => {
      if (still) return 0;
      const { top, height } = section.getBoundingClientRect();
      return Math.min(Math.max(-top / Math.max(height, 1), 0), 1);
    };

    const tick = (now: number) => {
      frame = 0;
      const target = progress();
      layer.style.setProperty("--par", target.toFixed(4));
      if (!scene) return;

      const dt = last ? Math.min(now - last, 64) : 16;
      shown += (target - shown) * (1 - Math.exp(-dt / LAG_MS));
      if (Math.abs(target - shown) < 1e-4) shown = target;

      if (shown !== drawnAt) {
        scene.draw(REST_YAW + shown * TURN);
        drawnAt = shown;
      }
      if (shown !== target) {
        last = now;
        frame = requestAnimationFrame(tick);
      } else {
        last = 0;
      }
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const resized = new ResizeObserver(() => {
      if (!scene) return;
      scene.resize();
      drawnAt = NaN;
      kick();
    });

    if (!still) {
      window.addEventListener("scroll", kick, { passive: true });
    }
    kick();

    Promise.all([
      import("@/frontend/site/hero-mark-scene"),
      loadModel(),
    ])
      .then(([{ createMarkScene }, stl]) => {
        if (disposed) return;
        scene = createMarkScene(canvas, stl);
        scene.resize();
        // Start at the page's current position rather than easing in from
        // the top, so a reload halfway down does not spin the mark into place.
        shown = progress();
        drawnAt = shown;
        scene.draw(REST_YAW + shown * TURN);
        resized.observe(canvas);
        setDrawn(true);
      })
      .catch((err) => {
        // Decorative: without WebGL, or without the model, the hero simply
        // has no mark. Said once in the console so a missing file is findable.
        console.warn("HeroMark: not drawn —", err);
      });

    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", kick);
      resized.disconnect();
      scene?.dispose();
      scene = null;
    };
  }, []);

  return (
    <div
      ref={layerRef}
      aria-hidden
      className={[
        "hero-object parallax pointer-events-none absolute inset-0 z-0 grid grid-rows-1 place-items-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative aspect-square w-[min(88%,34rem)]">
        {/* Bloom, as behind the dumbbell: it seats the mark on the olive
            instead of leaving it pasted on. Drawn in CSS, so it is there
            before the mark is. */}
        <div
          className="absolute inset-[8%] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, rgba(151,176,140,0.16), rgba(151,176,140,0.04) 48%, transparent 70%)",
          }}
        />
        <canvas
          ref={canvasRef}
          className={[
            "absolute inset-0 h-full w-full transition-opacity duration-700 ease-out",
            drawn ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
      </div>
    </div>
  );
}
