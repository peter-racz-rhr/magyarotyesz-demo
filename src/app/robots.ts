import type { MetadataRoute } from "next";

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://project-1y1mw.vercel.app").replace(/\/+$/, "");

/** Search engines may read the front page and the legal pages; the working screens and the admin stay out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/terms", "/privacy", "/imprint"], disallow: ["/admin", "/settings", "/profile", "/backup", "/map", "/nearby", "/welcome"] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
