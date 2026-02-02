export const siteConfig = {
  name: "vibePack",
  description: "Your SaaS Boilerplate",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og-image.png",
  locale: "ko_KR",
  creator: "vibePack",
  keywords: ["SaaS", "boilerplate", "Next.js", "React", "TypeScript", "vibePack"],
  links: {
    github: "https://github.com/vibepack",
    twitter: "https://twitter.com/vibepack",
  },
} as const;

export type SiteConfig = typeof siteConfig;
