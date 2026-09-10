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

function FooterBlock({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <p className="label text-mist">{title}</p>
      <div className="mt-2 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

/**
 * Site footer: the studio's details in small type, and the Planck credit in
 * the bottom-right corner. On phones Visit and WhatsApp share a row and the
 * hours take the full width below, which keeps the footer short.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-rule bg-ink px-5 sm:px-8">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 py-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-x-10">
        <div className="col-span-2 lg:col-span-1">
          <Wordmark />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-mist">
            Gym and coaching on Main Street, Zgharta.
          </p>
        </div>

        <FooterBlock title="Visit">
          <a
            href={STUDIO_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={footerLink}
          >
            {STUDIO_ADDRESS[0]}
            <br />
            {STUDIO_ADDRESS[1]}
          </a>
        </FooterBlock>

        <FooterBlock title="WhatsApp" className="lg:order-last">
          <a
            href={waLink(WHATSAPP_GREETING)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${footerLink} whitespace-nowrap`}
          >
            {STUDIO_WHATSAPP_DISPLAY}
          </a>
        </FooterBlock>

        <FooterBlock title="Hours" className="col-span-2 lg:col-span-1">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4">
            {STUDIO_HOURS.map(({ label, hours }) => (
              <div key={label} className="contents">
                <dt className="text-mist">{label}</dt>
                <dd className="text-bone">
                  {hours
                    ? `${formatTime(hours.open)} – ${formatTime(hours.close)}`
                    : "Closed"}
                </dd>
              </div>
            ))}
          </dl>
        </FooterBlock>
      </div>

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 border-t border-line py-4 text-xs text-mist">
        <p>© {new Date().getFullYear()} Vigorfit</p>
        <p className="text-mist/60">Developed by Planck</p>
      </div>
    </footer>
  );
}
