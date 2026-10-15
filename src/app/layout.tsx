import type { Metadata, Viewport } from "next";
import "@fontsource-variable/instrument-sans/wdth.css";
import "./globals.css";
import { GLASS_DIM_BOOT, GlassDim } from "@/components/glass-dim";
import { ServiceWorker } from "@/components/service-worker";
import { SyncRunner } from "@/components/sync-runner";

export const metadata: Metadata = {
  title: "magyarotyesz",
  description: "Toilet door codes in Budapest, shared by people who needed them too.",
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
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: GLASS_DIM_BOOT }} />
      </head>
      <body className="min-h-full">
        {children}
        <GlassDim />
        <ServiceWorker />
        <SyncRunner />
      </body>
    </html>
  );
}
