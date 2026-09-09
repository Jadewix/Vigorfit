import type { Metadata } from "next";
import { Anton, Archivo, Geist_Mono } from "next/font/google";
import "./globals.css";

// Display face — heavy condensed poster grotesque for the oversized headlines.
const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

// Body/UI face — sturdy neutral grotesque that holds up against the display.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

// Kept for the rare monospaced data readout (session times).
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      className={`${anton.variable} ${archivo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
