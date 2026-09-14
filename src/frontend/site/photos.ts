/**
 * The site's images.
 *
 * These are plain files in `public/`, dropped in by hand — there is no CMS and
 * no upload flow behind them. Each is referenced from exactly one place, so
 * swapping one is a matter of replacing the file, not editing markup.
 *
 * `width`/`height` are the file's intrinsic pixel size. They are declared so
 * the browser reserves the right box before the bytes arrive; if you replace a
 * file with one of a different size, update the numbers here to match.
 */

/**
 * The hero's weight. This one MUST have a transparent background — the bloom
 * and contact shadow behind it in `HeroObject` are what seat it on the olive,
 * and they only work against alpha. A version with its own backdrop baked in
 * will read as a pasted rectangle.
 *
 * It is a still rendered from a 3D model, not a photograph; the model and the
 * page that renders it live in `scripts/hero-dumbbell/`.
 */
export const HERO_OBJECT = {
  src: "/hero-dumbbell.webp",
  width: 1024,
  height: 1024,
} as const;
