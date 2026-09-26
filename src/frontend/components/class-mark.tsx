import { cn } from "@/shared/utils";
import { DumbbellIcon } from "@/frontend/components/icons";

/**
 * A class's picture: its photo when it has one, otherwise the one default
 * icon every class shares, on a sage square — the same square a coach
 * without a photo gets their initials on, so the Team and Classes bands are
 * built from one part. Size it with `className` (e.g. "h-16 w-16").
 * Decorative: the class's name always sits beside it.
 */
export function ClassMark({
  photoUrl,
  className,
}: {
  photoUrl?: string | null;
  className?: string;
}) {
  if (photoUrl) {
    return (
      // Photos are already 512px squares from the uploader, so a plain <img>
      // does the job without configuring next/image for Supabase Storage.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        width={512}
        height={512}
        loading="lazy"
        decoding="async"
        className={cn("shrink-0 object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center bg-sage text-ink",
        className,
      )}
    >
      <DumbbellIcon width="52%" height="52%" />
    </span>
  );
}
