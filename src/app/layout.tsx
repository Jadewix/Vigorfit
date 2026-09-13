import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

/*
  One family carries the whole product: display, body and data.

  A gym's records are numbers in columns — session times, slot capacities,
  client counts — so a monospaced face is the native typeface of the thing
  this app actually is, not a stylistic flourish. 700 does the display work,
  400 the body, and the fixed advance widths line every time up in the
  booking grid and the dashboards for free.
*/
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vigorfit — Private coaching, booked with intent",
  description:
    "One-to-one coaching for people who train seriously. Work with coaches who program for your body, your schedule, and your goals — and book your next session in minutes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
