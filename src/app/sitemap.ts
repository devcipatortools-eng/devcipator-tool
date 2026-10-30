import type { MetadataRoute } from "next";
import { CATEGORIES, SITE, TOOLS } from "@/config/tools.config";

// Fixed dates from the config rather than the build time, so lastmod only moves when the copy does.
const content = new Date(SITE.updated.content);
const legal = new Date(SITE.updated.legal);

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE.url, lastModified: content, changeFrequency: "weekly", priority: 1 },
    ...CATEGORIES.map((c) => ({ url: `${SITE.url}/category/${c.id}`, lastModified: content, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...TOOLS.map((t) => ({ url: `${SITE.url}/tools/${t.slug}`, lastModified: content, changeFrequency: "monthly" as const, priority: 0.9 })),
    { url: `${SITE.url}/privacy`, lastModified: legal, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE.url}/terms`, lastModified: legal, changeFrequency: "yearly", priority: 0.2 },
  ];
}
