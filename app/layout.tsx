import "./globals.css";
import { Providers } from "./providers";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "JobFlow",
  description: "Organize your job search.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="liquid-theme">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
