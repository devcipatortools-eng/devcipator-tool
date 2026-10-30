import type { Metadata } from "next";
import { SITE } from "@/config/tools.config";

export const ORGANIZATION_ID = `${SITE.url}/#organization`;
export const WEBSITE_ID = `${SITE.url}/#website`;

export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString();
}

const SITE_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE.name}: free, private PDF, image and audio tools` };

/**
 * Title, description, canonical URL and social tags for one page. Open Graph images come from the
 * opengraph-image files, and Twitter inherits title, description and image from Open Graph.
 *
 * Setting openGraph here drops the root image inherited from the layout, so pages in a segment without
 * its own opengraph-image file pass `siteImage`. Don't pass it elsewhere: it would beat the segment's file.
 */
export function pageMetadata({
  title,
  description,
  path,
  siteImage = false,
}: {
  title: string | { absolute: string };
  description: string;
  path: string;
  siteImage?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      locale: "en_US",
      url: path,
      title: typeof title === "string" ? `${title} | ${SITE.name}` : title.absolute,
      description,
      ...(siteImage && { images: [SITE_IMAGE] }),
    },
    twitter: { card: "summary_large_image" },
  };
}

/** schema.org BreadcrumbList; pass the same trail the visible breadcrumb shows. */
export function breadcrumbList(trail: Array<{ name: string; path: string }>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({ "@type": "ListItem", position: i + 1, name: crumb.name, item: absoluteUrl(crumb.path) })),
  };
}
