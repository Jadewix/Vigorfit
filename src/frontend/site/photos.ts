/**
 * The site's photographs.
 *
 * These are plain files in `public/`, dropped in by hand — there is no CMS and
 * no upload flow behind them. Both are referenced from exactly one place each,
 * so swapping a photo is a matter of replacing the file, not editing markup.
 *
 * Every consumer degrades gracefully when a file is missing (see `SitePhoto`
 * and `HeroObject`), so the page is never broken by an absent asset — it just
 * shows the ruled placeholder in its place.
 *
 * `width`/`height` are the files' intrinsic pixel sizes. They are declared so
 * the browser reserves the right box before the bytes arrive; if you replace a
 * file with one of a different size, update the numbers here to match.
 */

/**
 * The hero's weight. This one MUST have a transparent background — the bloom
 * and contact shadow behind it in `HeroObject` are what seat it on the olive,
 * and they only work against alpha. A version with its own backdrop baked in
 * will read as a pasted rectangle.
 */
export const HERO_OBJECT = {
  src: "/hero-dumbbell.webp",
  width: 1024,
  height: 1024,
} as const;

/** The training floor, in the Booking band. Landscape, no transparency needed. */
export const GYM_INTERIOR = {
  src: "/gym-interior.jpg",
  alt: "The training floor: a rig with rings and racked barbells under tall windows.",
  width: 1376,
  height: 768,
} as const;
