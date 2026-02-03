import { describe, it, expect } from "vitest";

describe("robots.ts", () => {
  it("returns valid robots config with sitemap", async () => {
    const { default: robots } = await import("@/app/robots");
    const result = robots();

    expect(result.rules).toBeDefined();
    expect(result.sitemap).toContain("/sitemap.xml");
  });

  it("disallows dashboard, admin, learn, and api paths", async () => {
    const { default: robots } = await import("@/app/robots");
    const result = robots();
    const disallow = Array.isArray(result.rules)
      ? result.rules.flatMap((r) => r.disallow ?? [])
      : (result.rules?.disallow ?? []);

    expect(disallow).toContain("/dashboard/");
    expect(disallow).toContain("/admin/");
    expect(disallow).toContain("/learn/");
    expect(disallow).toContain("/api/");
  });

  it("allows root path", async () => {
    const { default: robots } = await import("@/app/robots");
    const result = robots();
    const allow = Array.isArray(result.rules)
      ? result.rules.flatMap((r) => r.allow ?? [])
      : (result.rules?.allow ?? []);

    expect(allow).toContain("/");
  });
});
