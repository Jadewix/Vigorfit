"use client";

import { DayPicker, type DayPickerProps } from "react-day-picker";
import { cn } from "@/lib/utils";

/**
 * Calendar — the shadcn/ui Calendar API (a thin wrapper over react-day-picker)
 * restyled with this project's brand tokens instead of shadcn's
 * `background`/`primary` variables, which don't exist here.
 *
 * It is styled for the dark client surfaces (the booking flow). If it's ever
 * needed on the light admin/coach pages, give the colour classes `app-dark:`
 * variants the way the shared dashboard components do.
 *
 * The grid is FLUID, not fixed: day cells are `flex-1 basis-0 aspect-square`
 * rather than a hard `w-10`. Seven 40px cells plus padding gave the calendar a
 * 304px intrinsic minimum, and because a grid item's `min-width` is `auto` that
 * minimum blew the whole booking column past its container on narrow screens.
 * `max-w` keeps the desktop size it always had; below that it shrinks to fit.
 */
export type CalendarProps = DayPickerProps;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-full max-w-[20rem] p-2 sm:p-3", className)}
      classNames={{
        months: "relative flex flex-col gap-4",
        month: "flex flex-col gap-3",
        month_caption: "flex h-9 items-center justify-center px-9",
        caption_label:
          "text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-crimson",

        nav: "absolute inset-x-0 top-0 flex h-9 items-center justify-between",
        button_previous:
          "flex h-8 w-8 shrink-0 items-center justify-center border border-line text-mist transition-colors hover:border-crimson hover:text-crimson disabled:pointer-events-none disabled:opacity-40",
        button_next:
          "flex h-8 w-8 shrink-0 items-center justify-center border border-line text-mist transition-colors hover:border-crimson hover:text-crimson disabled:pointer-events-none disabled:opacity-40",
        chevron: "h-4 w-4 fill-current",

        month_grid: "w-full border-collapse",
        weekdays: "flex w-full",
        weekday:
          "min-w-0 flex-1 basis-0 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-mist",
        week: "mt-1 flex w-full",

        day: "aspect-square min-w-0 flex-1 basis-0 p-0 text-center text-[13px] sm:text-sm",
        day_button:
          "flex h-full w-full items-center justify-center border border-transparent tabular-nums text-bone transition-colors hover:border-crimson hover:text-crimson focus-visible:outline-none focus-visible:border-crimson",

        today: "text-crimson",
        outside: "text-mist/40",
        disabled: "text-mist/25 line-through",
        hidden: "invisible",
        selected: "[&>button]:border-crimson [&>button]:bg-crimson [&>button]:text-white [&>button]:hover:text-white",

        ...classNames,
      }}
      {...props}
    />
  );
}
