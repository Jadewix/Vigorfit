import Link from "next/link";
import { cn } from "@/shared/utils";
import { Logo } from "@/frontend/components/logo";

/**
 * The Vigorfit wordmark: the studio's logo, wrapped in a link home.
 *
 * Lives on its own because the site nav, the footer and the login screen all
 * need it and previously each carried its own copy — which is how two of them
 * ended up showing a stray "C" in the mark. One definition, one place to
 * change it.
 *
 * The mark used to be a bolt glyph in a burgundy cell with the name set in
 * the display face beside it. The real logo is one drawn lockup, so the cell
 * and the type are both gone: what replaced them is a single image, and the
 * only thing left to decide here is how tall it stands.
 *
 * 40px, rising to 44 from `sm`. The name inside the lockup is a little over a
 * third of its height, so at the 36px the old cell stood at the letters came
 * out at 13px — smaller than the nav links beside them, which made the logo
 * read as a caption rather than as the mark of the place.
 */
export function Wordmark({
  onClick,
  className,
}: {
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn("flex items-center", className)}
      aria-label="Vigorfit home"
    >
      {/* The link already names itself, so the artwork stays out of the
          accessibility tree rather than announcing "Vigorfit" twice. */}
      <Logo aria-hidden className="h-10 text-bone sm:h-11" />
    </Link>
  );
}
