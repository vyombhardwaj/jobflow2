import type { Metadata } from "next";
// @ts-ignore
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "JobFlow — Job Application Tracker",
  description: "Track every application, interview, and offer in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}