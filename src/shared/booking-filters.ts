import type { Booking, BookingStatus } from "@/shared/types";

/**
 * URL-driven filters for the booking list pages.
 *
 * The filter state lives in the query string rather than in component state
 * so a dashboard stat card can link straight at a filtered view — "Pending: 3"
 * lands on exactly those three — and so a filtered list stays shareable and
 * works with the back button.
 *
 * Everything here is deliberately forgiving: an unknown or repeated parameter
 * falls back to "all" rather than erroring, because these values arrive from
 * a URL a person can type.
 */
export type StatusFilter = "all" | BookingStatus;
export type WhenFilter = "all" | "upcoming" | "past";

const STATUSES: readonly StatusFilter[] = [
  "all",
  "pending",
  "confirmed",
  "cancelled",
  "completed",
];

const WHENS: readonly WhenFilter[] = ["all", "upcoming", "past"];

/** `searchParams` values are `string | string[] | undefined`. */
type Param = string | string[] | undefined;

function first(value: Param): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseStatus(value: Param): StatusFilter {
  const v = first(value);
  return STATUSES.includes(v as StatusFilter) ? (v as StatusFilter) : "all";
}

export function parseWhen(value: Param): WhenFilter {
  const v = first(value);
  return WHENS.includes(v as WhenFilter) ? (v as WhenFilter) : "all";
}

/**
 * Apply both filters to a list of bookings.
 *
 * `upcoming` mirrors the coach dashboard's own "Upcoming sessions" figure
 * exactly — future and not cancelled — so the count on the card and the rows
 * on this page cannot drift apart.
 */
export function filterBookings(
  bookings: Booking[],
  { status, when }: { status: StatusFilter; when: WhenFilter },
  now: string = new Date().toISOString(),
): Booking[] {
  return bookings.filter((b) => {
    if (status !== "all" && b.status !== status) return false;
    if (when === "upcoming") {
      return b.starts_at >= now && b.status !== "cancelled";
    }
    if (when === "past") return b.starts_at < now;
    return true;
  });
}

/**
 * Build the query string for one filter combination, leaving out anything set
 * to "all" so the unfiltered view stays a clean URL.
 */
export function filterHref(
  basePath: string,
  { status, when }: { status?: StatusFilter; when?: WhenFilter },
): string {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (when && when !== "all") params.set("when", when);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
