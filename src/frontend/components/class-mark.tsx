import { cn } from "@/shared/utils";
import {
  DumbbellIcon,
  LotusIcon,
  PullUpIcon,
} from "@/frontend/components/icons";

const GLYPHS = {
  dumbbell: DumbbellIcon,
  lotus: LotusIcon,
  pullup: PullUpIcon,
};

export type ClassIcon = keyof typeof GLYPHS;

/**
 * A class's picture: a photo when it has one, otherwise its glyph on a sage
 * square — the same square a coach without a photo gets their initials on, so
 * the Team and Classes bands are built from one part. Size it with
 * `className` (e.g. "h-16 w-16"). Decorative: the class's name always sits
 * beside it.
 */
export function ClassMark({
  icon,
  photo,
  className,
}: {
  icon: ClassIcon;
  /** A path under public/, e.g. "/classes/yoga.jpg". Square works best. */
  photo?: string;
  className?: string;
}) {
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn("shrink-0 object-cover", className)}
      />
    );
  }
  const Glyph = GLYPHS[icon];
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center bg-sage text-ink",
        className,
      )}
    >
      <Glyph width="52%" height="52%" />
    </span>
  );
}
