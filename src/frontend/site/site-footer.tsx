import { Wordmark } from "@/frontend/site/wordmark";
import { MapPinIcon, WhatsAppIcon } from "@/frontend/components/icons";
import {
  STUDIO_ADDRESS,
  STUDIO_HOURS,
  STUDIO_MAPS_URL,
  STUDIO_WHATSAPP_DISPLAY,
  WHATSAPP_GREETING,
  formatClock,
  waLink,
} from "@/shared/studio";

/*
  The two detail rows — where the studio is, and how to reach it — are built
  the same way: the whole row is one link, opening with a glyph and ending in
  a bright underlined value. Sharing these three class strings is what keeps
  them identical rather than slowly drifting apart.
*/
const detailRow =
  "group flex items-start gap-2 transition-colors hover:text-sage-lift";

// 3px of top margin rather than `items-center`: the glyph should sit on the
// first line's optical centre and stay there if the text wraps on a phone.
//
// Burgundy, and it holds that colour through the row's hover while the words
// beside it go sage. The glyph is a mark rather than part of the label, and at
// 3.19:1 it is comfortably past the 3:1 an icon is held to.
const detailIcon = "mt-[3px] shrink-0 text-brick";

const detailValue =
  "text-grey underline decoration-line underline-offset-4 transition-colors group-hover:text-sage-lift group-hover:decoration-sage";

// 44px tall so it is a real tap target, but laid out in a row rather than a
// column — stacked, four of these alone were 176px of the footer's height.
const navLink =
  "tag inline-flex min-h-11 items-center text-sage-dim transition-colors hover:text-grey";

// The same anchors the site nav uses. Repeated here rather than shared,
// because a footer's job is to be the complete index of the page while the
// nav's is to be the short one — they are free to diverge.
const sections = [
  { href: "#top", label: "Home" },
  { href: "#team", label: "Team" },
  { href: "#classes", label: "Classes" },
  { href: "#booking", label: "Booking" },
  { href: "#contact", label: "Contact" },
];

/**
 * The footer: a black well under the Contact band, parted from it by a
 * single burgundy hairline — the last red on the page, closing it on the
 * colour the booking buttons above it were filled with.
 *
 * Deliberately short. Everything here is a repeat of something stated more
 * fully further up the page, so it earns a few lines rather than a screen:
 * the mark and the index on one row, the address, the number and the hours
 * beneath it, and the small print under a rule.
 */
export function SiteFooter() {
  return (
    <footer className="brand-black border-t border-oxblood px-5 pb-6 pt-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2">
          <Wordmark />

          <nav aria-label="Footer">
            <ul className="-my-2 flex flex-wrap gap-x-5">
              {sections.map((s) => (
                <li key={s.href}>
                  <a href={s.href} className={navLink}>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-5 space-y-1.5 text-sm leading-relaxed text-sage-dim">
          {/*
            Each glyph sits inside its link rather than beside it, so the icon
            is part of the target instead of a decoration next to one. Both are
            aria-hidden: the text already names the destination, and announcing
            it twice would only add noise.
          */}
          <p>
            <a
              href={STUDIO_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={detailRow}
            >
              <MapPinIcon
                aria-hidden
                width={15}
                height={15}
                className={detailIcon}
              />
              <span className={detailValue}>{STUDIO_ADDRESS.join(", ")}</span>
            </a>
          </p>

          {/*
            The label/value split survives inside the link: "WhatsApp" stays
            the quiet term and the number stays the bright figure — the same
            relationship the ledgers upstairs use.
          */}
          <p>
            <a
              href={waLink(WHATSAPP_GREETING)}
              target="_blank"
              rel="noopener noreferrer"
              className={detailRow}
            >
              <WhatsAppIcon
                aria-hidden
                width={15}
                height={15}
                className={detailIcon}
              />
              <span>
                WhatsApp{" "}
                <span className={`${detailValue} whitespace-nowrap`}>
                  {STUDIO_WHATSAPP_DISPLAY}
                </span>
              </span>
            </a>
          </p>

          {/*
            One wrapped line, not the ledger. The ledger upstairs needs the
            full measure to hold its figures against the right edge; down here
            the hours are a reminder rather than a table, and three short pairs
            read fine.
          */}
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {STUDIO_HOURS.map(({ label, hours }) => (
              <li key={label} className="whitespace-nowrap">
                {label}{" "}
                <span className={hours ? "text-grey" : "text-brick"}>
                  {hours
                    ? `${formatClock(hours.open)}–${formatClock(hours.close)}`
                    : "Closed"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line pt-4 text-[11px] text-sage-dim">
          <p>© {new Date().getFullYear()} Vigorfit</p>
          <p className="text-sage-dim/60">Developed by Planck</p>
        </div>
      </div>
    </footer>
  );
}
