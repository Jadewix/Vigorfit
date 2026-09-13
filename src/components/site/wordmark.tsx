import Link from "next/link";
import { cn } from "@/lib/utils";
import { BoltIcon } from "@/components/icons";

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
      <span className="flex h-9 w-9 items-center justify-center bg-sage text-ink">
        <BoltIcon width={19} height={19} />
      </span>
      <span className="display text-2xl text-bone">
        Vigorfit<span className="text-sage">.</span>
      </span>
    </Link>
  );
}
