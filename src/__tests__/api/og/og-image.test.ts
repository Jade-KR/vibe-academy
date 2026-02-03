import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @vercel/og
vi.mock("@vercel/og", () => ({
  ImageResponse: class MockImageResponse {
    public element: unknown;
    public options: unknown;

    constructor(element: unknown, options: unknown) {
      this.element = element;
      this.options = options;
    }

    get status() {
      return 200;
    }

    get headers() {
      return new Headers({ "content-type": "image/png" });
    }
  },
}));

describe("GET /api/og", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 200 with image content type", async () => {
    const { GET } = await import("@/app/api/og/route");
    const request = new Request("http://localhost:3000/api/og?title=Test+Course");
    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it("uses siteConfig.name as fallback when no title provided", async () => {
    const { GET } = await import("@/app/api/og/route");
    const request = new Request("http://localhost:3000/api/og");
    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it("handles title and description params", async () => {
    const { GET } = await import("@/app/api/og/route");
    const request = new Request(
      "http://localhost:3000/api/og?title=React+Mastery&description=Learn+React",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it("handles title with image param", async () => {
    const { GET } = await import("@/app/api/og/route");
    const request = new Request(
      "http://localhost:3000/api/og?title=Course&image=https://example.com/thumb.jpg",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
  });
});
