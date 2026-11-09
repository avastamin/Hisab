import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import "./globals.css";
import { Toaster } from "@/components/Toaster";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Hisab",
  description: "Track household and farm money, from any device.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2F7A4D",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // A theme picked in the app wins over the device's; without one, the CSS follows the device.
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html lang="en" className="h-full antialiased" data-theme={theme === "system" ? undefined : theme}>
      <body className="min-h-full flex flex-col">
        {children}
        {/* Suspense because the toaster reads the URL's search params. */}
        <Suspense fallback={null}>
          <Toaster />
        </Suspense>
      </body>
    </html>
  );
}
