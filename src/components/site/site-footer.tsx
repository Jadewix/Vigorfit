import { Wordmark } from "@/components/site/site-nav";
import {
  STUDIO_ADDRESS,
  STUDIO_HOURS,
  STUDIO_MAPS_URL,
  STUDIO_WHATSAPP_DISPLAY,
  WHATSAPP_GREETING,
  formatTime,
  waLink,
} from "@/lib/studio";

const footerLink = "text-bone transition-colors hover:text-crimson";

/**
 * Compact, centred footer: the studio's details in small type, with the
 * copyright bottom left and the Planck credit bottom right.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-rule bg-ink px-5 pb-5 pt-8 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
        <Wordmark />
        <div className="space-y-1.5 text-xs leading-relaxed text-mist">
          <p>
            <a
              href={STUDIO_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={footerLink}
            >
              {STUDIO_ADDRESS.join(", ")}
            </a>
          </p>
          <p>
            WhatsApp{" "}
            <a
              href={waLink(WHATSAPP_GREETING)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${footerLink} whitespace-nowrap`}
            >
              {STUDIO_WHATSAPP_DISPLAY}
            </a>
          </p>
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            {STUDIO_HOURS.map(({ label, hours }) => (
              <li key={label} className="whitespace-nowrap">
                {label}{" "}
                <span className="text-bone">
                  {hours
                    ? `${formatTime(hours.open)}–${formatTime(hours.close)}`
                    : "Closed"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-6 flex max-w-6xl items-center justify-between gap-4 border-t border-line pt-4 text-[11px] text-mist">
        <p>© {new Date().getFullYear()} Vigorfit</p>
        <p className="text-mist/60">Developed by Planck</p>
      </div>
    </footer>
  );
}
