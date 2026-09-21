import { cn } from "@/shared/utils";
import { CheckIcon, SlashIcon } from "@/frontend/components/icons";

/**
 * One cell in the availability grid, and the single place the three slot
 * states are defined.
 *
 * Every cell is the same fixed size. The time is kept on one line
 * (`whitespace-nowrap` plus a slightly smaller size) so cells don't end up a
 * mix of one- and two-line boxes, and `tabular-nums` keeps the digits aligned
 * across the grid.
 */
const base =
  "flex h-14 flex-col items-center justify-center gap-1 border px-1 text-center text-[13px] font-medium leading-none tabular-nums transition-colors";

export type SlotState = "available" | "selected" | "mine" | "full";

/**
 * Which state a slot is in, derived from the API's shape.
 *
 * The order matters. `/api/coaches/[coachId]/slots` sets
 * `taken = remaining === 0 || mine`, so a slot you booked is always *also*
 * flagged taken — checking `mine` first is what stops your own session being
 * drawn as a rejection.
 */
export function slotStateOf(
  slot: { taken: boolean; mine: boolean },
  selected: boolean,
): SlotState {
  if (slot.mine) return "mine";
  if (slot.taken) return "full";
  return selected ? "selected" : "available";
}

const styles: Record<SlotState, string> = {
  available: "border-line bg-ground text-bone hover:border-sage hover:text-sage-lift",
  selected: "border-sage bg-sage text-ink",
  // Your own booking: a result, not a block. Deliberately not struck through —
  // striking it read as a cancellation of something you actually hold.
  mine: "cursor-default border-sage bg-panel-green text-bone",
  // Oxblood carries the border and the fill, but never the text: oxblood on
  // this ground measures 1.42:1, so the glyphs use red-lift instead.
  full: "cursor-not-allowed border-oxblood/70 bg-panel-red text-red-lift",
};

/** "14:00" -> "2:00 PM" */
export function label12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function SlotCell({
  time,
  state,
  remaining,
  inClass,
  onSelect,
}: {
  time: string;
  state: SlotState;
  /** Places left; a lone remaining place is called out. */
  remaining?: number;
  /** Taken because the coach is running a class, not because it is full. */
  inClass?: boolean;
  onSelect?: () => void;
}) {
  const label = label12h(time);

  if (state === "mine") {
    return (
      <span
        aria-disabled
        title="You already booked this time"
        className={cn(base, styles.mine)}
      >
        <span className="whitespace-nowrap">{label}</span>
        {/* The icon and the word are both carried, so the state survives for
            anyone who cannot separate the green from the red. */}
        <span className="flex items-center gap-1 text-[10px] font-normal uppercase tracking-wide text-sage-lift">
          <CheckIcon width={11} height={11} strokeWidth={2.4} />
          Yours
        </span>
      </span>
    );
  }

  if (state === "full") {
    return (
      <span
        aria-disabled
        title={inClass ? "Your coach is running a class" : "Fully booked"}
        className={cn(base, styles.full)}
      >
        <span className="whitespace-nowrap line-through decoration-[1.5px]">
          {label}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-normal uppercase tracking-wide">
          <SlashIcon width={11} height={11} strokeWidth={2.2} />
          {inClass ? "Class" : "Full"}
        </span>
      </span>
    );
  }

  const selected = state === "selected";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        base,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-ground",
        selected ? styles.selected : styles.available,
      )}
    >
      <span className="whitespace-nowrap">{label}</span>
      {remaining === 1 && (
        // Scarcity, not a block — so this stays off the red, which the palette
        // reserves for "you cannot have this".
        <span
          className={cn(
            "whitespace-nowrap text-[10px] font-normal uppercase tracking-wide",
            selected ? "text-ink/70" : "text-sage-lift",
          )}
        >
          1 left
        </span>
      )}
    </button>
  );
}
