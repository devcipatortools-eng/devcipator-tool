import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { THEME_INIT_SCRIPT } from "@/components/layout/ThemeToggle";
import { JsonLd } from "@/components/seo/JsonLd";
import { PAGE_SEO, SITE } from "@/config/tools.config";
import { ORGANIZATION_ID, WEBSITE_ID, absoluteUrl } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Codes from Google Search Console and Bing Webmaster Tools ("HTML tag" method). Unset ones render nothing.
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

// No canonical here: it would be inherited by every page that doesn't set one, including the 404.
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: PAGE_SEO.home.title,
    template: `%s | ${SITE.name}`,
  },
  description: PAGE_SEO.home.description,
  // Tool and category pages replace these with their own.
  keywords: SITE.keywords,
  applicationName: SITE.name,
  authors: [{ name: SITE.organization, url: SITE.organizationUrl }],
  creator: SITE.organization,
  publisher: SITE.organization,
  category: "technology",
  // Stops iOS turning numbers in tool output (page counts, sizes) into phone links.
  formatDetection: { telephone: false, email: false, address: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  verification: {
    ...(googleVerification && { google: googleVerification }),
    ...(bingVerification && { other: { "msvalidate.01": bingVerification } }),
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_US",
    title: PAGE_SEO.home.title,
    description: PAGE_SEO.home.description,
  },
  twitter: { card: "summary_large_image" },
};

const SITE_GRAPH = [
  {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE.organization,
    url: absoluteUrl("/"),
    logo: { "@type": "ImageObject", url: absoluteUrl(SITE.logo), width: 924, height: 192 },
  },
  {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE.name,
    alternateName: SITE.organization,
    url: absoluteUrl("/"),
    description: SITE.description,
    inLanguage: "en",
    publisher: { "@id": ORGANIZATION_ID },
  },
];

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1220" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <JsonLd graph={SITE_GRAPH} />
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg">
          Skip to content
        </a>
        <Navbar />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
