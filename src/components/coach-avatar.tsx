import { cn } from "@/lib/utils";

function initialsOf(name: string): string {
  return (
    name
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "C"
  );
}

/**
 * A coach's photo, or their initials on a sage square when they haven't
 * added one. Size it with `className` (e.g. "h-12 w-12 text-lg"). It's
 * decorative: the coach's name always sits next to it.
 */
export function CoachAvatar({
  name,
  photoUrl,
  className,
}: {
  name: string;
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
        "flex shrink-0 items-center justify-center bg-sage font-display text-ink",
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
