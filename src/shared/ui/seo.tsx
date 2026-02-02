import type { Metadata } from "next";
import { siteConfig } from "@/shared/config/site";

interface SEOOptions {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  noIndex?: boolean;
  keywords?: string[];
  type?: "website" | "article";
}

function generateSEO({
  title,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  url = siteConfig.url,
  noIndex = false,
  keywords,
  type = "website",
}: SEOOptions = {}): Metadata {
  const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;

  const imageUrl = image.startsWith("http") ? image : `${siteConfig.url}${image}`;

  return {
    title: fullTitle,
    description,
    keywords,
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: siteConfig.name,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: siteConfig.locale,
      type,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}

// JSON-LD structured data component (server component compatible)
interface JsonLdProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

function JsonLd({ data }: JsonLdProps) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

export { generateSEO, JsonLd };
export type { SEOOptions, JsonLdProps };
