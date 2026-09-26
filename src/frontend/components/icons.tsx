type IconProps = React.SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function GridIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

/**
 * A week laid out in columns, for the coach's schedule.
 *
 * Deliberately not CalendarIcon with a tweak: "My sessions" already owns that
 * glyph three rows away in the same sidebar, and two calendars side by side
 * make a list you have to read rather than scan. The ruled columns say "a
 * week at a glance" where the other says "a list of dates".
 */
export function WeekIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M9 9v12M15 9v12" />
    </svg>
  );
}

/** Map pin, for the studio's address wherever it links out to Maps. */
export function MapPinIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/**
 * Message bubble, for the studio's WhatsApp number.
 *
 * Deliberately the bubble silhouette only, with no handset inside: at the 15px
 * this is used at in the footer, interior detail turns to mush. The word
 * "WhatsApp" sits beside it and does the naming, so the glyph only has to say
 * "a conversation".
 */
export function WhatsAppIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.6A8.4 8.4 0 0 1 4 11.5a8.5 8.5 0 0 1 17 0z" />
    </svg>
  );
}

/**
 * Instagram glyph, for the studio's and Jad's profiles in the footer. The
 * corner dot is a zero-length path that the round linecap draws as a point —
 * it stays crisp at the 15px this is used at, where a tiny stroked circle
 * would fill to a blob.
 */
export function InstagramIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function WhistleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 8h11a5 5 0 1 1-5 5V8" />
      <circle cx="9" cy="13" r="1" />
      <path d="M14 8l4-3" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/**
 * A circle with a bar through it — "unavailable". Paired with the red slot
 * fill so that "full" is legible without relying on colour alone.
 */
export function SlashIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </svg>
  );
}

/** A note left for someone — the admin's feedback inbox. */
export function MessageIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 8h8M8 12h5" />
    </svg>
  );
}

/** A dumbbell: Classes in the navs, and every class until it has a photo. */
export function DumbbellIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7.5 12h9" />
      <rect x="4.5" y="7" width="3" height="10" rx="1" />
      <rect x="16.5" y="7" width="3" height="10" rx="1" />
      <path d="M2.5 10v4M21.5 10v4" />
    </svg>
  );
}
