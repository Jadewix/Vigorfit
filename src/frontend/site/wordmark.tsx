import Link from "next/link";
import { cn } from "@/shared/utils";
import { BoltIcon } from "@/frontend/components/icons";

/**
 * The Vigorfit wordmark.
 *
 * Lives on its own because the site nav and the login screen both need it and
 * previously each carried its own copy — which is how both ended up showing a
 * stray "C" in the mark. One definition, one place to change it.
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
      className={cn("flex items-center gap-2.5", className)}
      aria-label="Vigorfit home"
    >
      {/*
        The mark's cell is the first burgundy a visitor meets, and putting it
        here rather than on a button is what keeps the colour reading as the
        brand's own. A red that is only ever a call to action starts to look
        like an alert; a red that opens on the logo does not.
      */}
      <span className="flex h-9 w-9 items-center justify-center bg-oxblood text-bone">
        <BoltIcon width={19} height={19} />
      </span>
      <span className="display text-2xl text-bone">
        Vigorfit<span className="text-brick">.</span>
      </span>
    </Link>
  );
}
