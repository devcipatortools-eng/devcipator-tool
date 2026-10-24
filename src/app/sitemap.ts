import type { MetadataRoute } from "next";
import { CATEGORIES, SITE, TOOLS } from "@/config/tools.config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE.url, changeFrequency: "weekly", priority: 1 },
    ...CATEGORIES.map((c) => ({ url: `${SITE.url}/category/${c.id}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...TOOLS.map((t) => ({ url: `${SITE.url}/tools/${t.slug}`, changeFrequency: "monthly" as const, priority: 0.9 })),
    { url: `${SITE.url}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE.url}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
