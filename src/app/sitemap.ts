import type { MetadataRoute } from "next";

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://project-1y1mw.vercel.app").replace(/\/+$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/terms", "/privacy", "/imprint", "/delete-account"].map((path) => ({ url: `${site}${path}`, changeFrequency: "monthly", priority: path === "/" ? 1 : 0.4 }));
}
