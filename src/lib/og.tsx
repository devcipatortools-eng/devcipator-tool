import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE } from "@/config/tools.config";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// The logo is orange on transparent, so it sits on a white card framed by the brand gradient.
const logoSrc = `data:image/png;base64,${await readFile(join(process.cwd(), "public/devcipator-logo.png"), "base64")}`;
const host = new URL(SITE.url).host;

/** 1200×630 share card. Text uses next/og's bundled Geist, the site's own typeface. */
export function ogImage({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", padding: 40, background: "linear-gradient(135deg, #FF4D00 0%, #FF7151 100%)" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "56px 64px",
            borderRadius: 32,
            background: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser */}
            <img src={logoSrc} width={270} height={56} alt="" />
            <div style={{ display: "flex", padding: "10px 22px", borderRadius: 999, background: "#FFF0E9", color: "#D94100", fontSize: 26 }}>{eyebrow}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: title.length > 24 ? 64 : 76, lineHeight: 1.08, letterSpacing: -2, color: "#14161f" }}>{title}</div>
            <div style={{ fontSize: 30, lineHeight: 1.35, color: "#4b5163", maxWidth: 980 }}>{description}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 26 }}>
            <div style={{ color: "#E64500" }}>Free · No upload · Files stay on your device</div>
            <div style={{ color: "#8a8fa0" }}>{host}</div>
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
