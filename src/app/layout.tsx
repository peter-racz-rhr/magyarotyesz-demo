import type { Metadata, Viewport } from "next";
import "@fontsource-variable/instrument-sans/wdth.css";
import "./globals.css";
import { BackSwipe } from "@/components/back-swipe";
import { HapticsRunner } from "@/components/haptics-runner";
import { ServiceWorker } from "@/components/service-worker";
import { SyncRunner } from "@/components/sync-runner";
import { THEME_BOOT, ThemeRunner } from "@/lib/theme";

export const metadata: Metadata = {
  title: "magyarotyesz",
  description: "Toilet door codes, shared by people who needed them too.",
  applicationName: "magyarotyesz",
  appleWebApp: {
    capable: true,
    title: "magyarotyesz",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#121212",
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="min-h-full">
        <ThemeRunner />
        <HapticsRunner />
        {children}
        <BackSwipe />
        <ServiceWorker />
        <SyncRunner />
      </body>
    </html>
  );
}
