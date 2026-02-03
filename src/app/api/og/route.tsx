import { ImageResponse } from "@vercel/og";
import { siteConfig } from "@/shared/config/site";

export const runtime = "edge";

// Cache font data at module level to avoid refetching on every request
let fontCache: ArrayBuffer | null = null;

async function loadFont(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;

  // Fetch Noto Sans KR Bold from Google Fonts CSS, then extract woff2 URL
  const cssResponse = await fetch(
    "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&display=swap",
    { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" } },
  );
  const css = await cssResponse.text();

  // Extract the first woff2 URL from the CSS response
  const fontUrlMatch = css.match(/src:\s*url\(([^)]+\.woff2)\)/);
  if (!fontUrlMatch?.[1]) {
    throw new Error("Could not extract font URL from Google Fonts CSS");
  }

  const fontResponse = await fetch(fontUrlMatch[1]);
  fontCache = await fontResponse.arrayBuffer();
  return fontCache;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title") || siteConfig.name;
    const description = searchParams.get("description") || "";
    const image = searchParams.get("image") || "";

    const notoSansKR = await loadFont();

    const response = new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          padding: "60px",
          fontFamily: "NotoSansKR",
        }}
      >
        {/* Left content area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#a5b4fc",
              marginBottom: 16,
            }}
          >
            {siteConfig.name}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 52,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.2,
            }}
          >
            {title.length > 60 ? `${title.slice(0, 60)}...` : title}
          </div>
          {description ? (
            <div
              style={{
                display: "flex",
                fontSize: 24,
                color: "#c7d2fe",
                marginTop: 20,
                lineHeight: 1.4,
              }}
            >
              {description.length > 100 ? `${description.slice(0, 100)}...` : description}
            </div>
          ) : null}
        </div>
        {/* Optional thumbnail on right */}
        {image ? (
          <div
            style={{
              display: "flex",
              width: 280,
              height: 280,
              borderRadius: 16,
              overflow: "hidden",
              marginLeft: 40,
              alignSelf: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} width={280} height={280} alt="" style={{ objectFit: "cover" }} />
          </div>
        ) : null}
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: "NotoSansKR", data: notoSansKR, weight: 700 as const, style: "normal" as const },
        ],
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=604800",
        },
      },
    );

    return response;
  } catch {
    // Fallback: return a simple image with just the site name
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          fontSize: 64,
          fontWeight: 700,
          color: "#ffffff",
        }}
      >
        {siteConfig.name}
      </div>,
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=604800",
        },
      },
    );
  }
}
