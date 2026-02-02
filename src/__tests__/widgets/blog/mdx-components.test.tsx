import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

describe("getMDXComponents", () => {
  it("returns an object with all required component keys", async () => {
    const { getMDXComponents } = await import("@/widgets/blog/ui/mdx-components");
    const components = getMDXComponents();
    const requiredKeys = [
      "h1",
      "h2",
      "h3",
      "h4",
      "p",
      "a",
      "code",
      "pre",
      "img",
      "ul",
      "ol",
      "li",
      "blockquote",
    ];
    for (const key of requiredKeys) {
      expect(components).toHaveProperty(key);
    }
  });

  it("h1 renders with correct semantic element and styling", async () => {
    const { getMDXComponents } = await import("@/widgets/blog/ui/mdx-components");
    const components = getMDXComponents();
    const H1 = components.h1 as React.FC<React.HTMLAttributes<HTMLHeadingElement>>;
    const { container } = render(<H1>Test Heading</H1>);
    const h1 = container.querySelector("h1");
    expect(h1).toBeInTheDocument();
    expect(h1).toHaveTextContent("Test Heading");
    expect(h1?.className).toContain("text-4xl");
    expect(h1?.className).toContain("font-bold");
  });

  it("h2 renders as h2 element", async () => {
    const { getMDXComponents } = await import("@/widgets/blog/ui/mdx-components");
    const components = getMDXComponents();
    const H2 = components.h2 as React.FC<React.HTMLAttributes<HTMLHeadingElement>>;
    const { container } = render(<H2>Sub Heading</H2>);
    expect(container.querySelector("h2")).toBeInTheDocument();
  });

  it("p renders as paragraph element", async () => {
    const { getMDXComponents } = await import("@/widgets/blog/ui/mdx-components");
    const components = getMDXComponents();
    const P = components.p as React.FC<React.HTMLAttributes<HTMLParagraphElement>>;
    const { container } = render(<P>Paragraph text</P>);
    expect(container.querySelector("p")).toBeInTheDocument();
  });

  it("a renders as anchor tag with correct href", async () => {
    const { getMDXComponents } = await import("@/widgets/blog/ui/mdx-components");
    const components = getMDXComponents();
    const A = components.a as React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>>;
    const { container } = render(<A href="https://example.com">Link</A>);
    const anchor = container.querySelector("a");
    expect(anchor).toBeInTheDocument();
    expect(anchor).toHaveAttribute("href", "https://example.com");
  });

  it("h1 renders with id attribute derived from children text", async () => {
    const { getMDXComponents } = await import("@/widgets/blog/ui/mdx-components");
    const components = getMDXComponents();
    const H1 = components.h1 as React.FC<React.HTMLAttributes<HTMLHeadingElement>>;
    const { container } = render(<H1>Introduction</H1>);
    const h1 = container.querySelector("h1");
    expect(h1).toHaveAttribute("id", "introduction");
  });

  it("h2 renders with id attribute derived from children text", async () => {
    const { getMDXComponents } = await import("@/widgets/blog/ui/mdx-components");
    const components = getMDXComponents();
    const H2 = components.h2 as React.FC<React.HTMLAttributes<HTMLHeadingElement>>;
    const { container } = render(<H2>Data Collection</H2>);
    const h2 = container.querySelector("h2");
    expect(h2).toHaveAttribute("id", "data-collection");
  });

  it("h3 renders with id attribute derived from children text", async () => {
    const { getMDXComponents } = await import("@/widgets/blog/ui/mdx-components");
    const components = getMDXComponents();
    const H3 = components.h3 as React.FC<React.HTMLAttributes<HTMLHeadingElement>>;
    const { container } = render(<H3>Sub Section</H3>);
    const h3 = container.querySelector("h3");
    expect(h3).toHaveAttribute("id", "sub-section");
  });

  it("h4 renders with id attribute derived from children text", async () => {
    const { getMDXComponents } = await import("@/widgets/blog/ui/mdx-components");
    const components = getMDXComponents();
    const H4 = components.h4 as React.FC<React.HTMLAttributes<HTMLHeadingElement>>;
    const { container } = render(<H4>Detail Point</H4>);
    const h4 = container.querySelector("h4");
    expect(h4).toHaveAttribute("id", "detail-point");
  });

  it("blockquote renders with border styling", async () => {
    const { getMDXComponents } = await import("@/widgets/blog/ui/mdx-components");
    const components = getMDXComponents();
    const BQ = components.blockquote as React.FC<React.HTMLAttributes<HTMLQuoteElement>>;
    const { container } = render(<BQ>Quote text</BQ>);
    const bq = container.querySelector("blockquote");
    expect(bq).toBeInTheDocument();
    expect(bq?.className).toContain("border-l-4");
  });
});
