import type { Metadata, Viewport } from "next";
import "@fontsource-variable/instrument-sans/wdth.css";
import "./globals.css";
import { ServiceWorker } from "@/components/service-worker";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
