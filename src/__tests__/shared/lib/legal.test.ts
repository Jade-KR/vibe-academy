import { describe, it, expect } from "vitest";
import { slugify, extractTableOfContents, getLegalPage } from "@/shared/lib/legal";
import type { LegalFrontmatter, LegalPage, TocItem } from "@/shared/lib/legal";

describe("legal utilities", () => {
  describe("slugify", () => {
    it("converts heading text to lowercase kebab-case", () => {
      expect(slugify("Data Collection")).toBe("data-collection");
    });

    it("preserves non-latin characters like Korean", () => {
      expect(slugify("Korean text 한글")).toBe("korean-text-한글");
    });

    it("removes special characters and collapses spaces", () => {
      expect(slugify("Multiple   Spaces & Special!")).toBe("multiple-spaces-special");
    });

    it("trims leading and trailing dashes", () => {
      expect(slugify("  Hello World  ")).toBe("hello-world");
    });

    it("handles empty string", () => {
      expect(slugify("")).toBe("");
    });
  });

  describe("extractTableOfContents", () => {
    it("extracts h2 headings from markdown content", () => {
      const content = `
# Title

Some text.

## First Section

Content here.

## Second Section

More content.

### Sub Section

Not extracted.
`;
      const result = extractTableOfContents(content);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "first-section",
        title: "First Section",
      });
      expect(result[1]).toEqual({
        id: "second-section",
        title: "Second Section",
      });
    });

    it("returns empty array for content with no h2 headings", () => {
      const content = `
# Only H1

Some text.

### Only H3

More text.
`;
      expect(extractTableOfContents(content)).toEqual([]);
    });

    it("handles Korean headings", () => {
      const content = `
## 개인정보의 수집 항목

내용

## 수집 및 이용 목적

내용
`;
      const result = extractTableOfContents(content);
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("개인정보의 수집 항목");
      expect(result[0].id).toBe("개인정보의-수집-항목");
    });
  });

  describe("getLegalPage", () => {
    it("returns correct data for terms-ko", () => {
      const page = getLegalPage("terms", "ko");
      expect(page).not.toBeNull();
      expect(page!.slug).toBe("terms");
      expect(page!.frontmatter.locale).toBe("ko");
      expect(page!.frontmatter.title).toBe("이용약관");
      expect(page!.frontmatter.description).toBeDefined();
      expect(page!.frontmatter.lastModified).toBeDefined();
      expect(page!.content).toBeDefined();
    });

    it("returns correct data for privacy-en", () => {
      const page = getLegalPage("privacy", "en");
      expect(page).not.toBeNull();
      expect(page!.slug).toBe("privacy");
      expect(page!.frontmatter.locale).toBe("en");
      expect(page!.frontmatter.title).toBe("Privacy Policy");
    });

    it("extractTableOfContents works on actual legal content", () => {
      const page = getLegalPage("terms", "ko");
      expect(page).not.toBeNull();
      const toc = extractTableOfContents(page!.content);
      expect(toc.length).toBeGreaterThanOrEqual(5);
      expect(toc[0].id).toBeDefined();
      expect(toc[0].title).toBeDefined();
    });

    it("returns null for non-existent slug", () => {
      const page = getLegalPage("nonexistent", "ko");
      expect(page).toBeNull();
    });

    it("returns null for non-existent locale variant", () => {
      const page = getLegalPage("terms", "fr");
      expect(page).toBeNull();
    });
  });

  describe("LegalFrontmatter type", () => {
    it("has required fields", () => {
      const fm: LegalFrontmatter = {
        title: "Test",
        description: "Test description",
        lastModified: "2026-01-28",
        locale: "ko",
      };
      expect(fm.title).toBe("Test");
      expect(fm.description).toBe("Test description");
      expect(fm.lastModified).toBe("2026-01-28");
      expect(fm.locale).toBe("ko");
    });
  });

  describe("LegalPage type", () => {
    it("has required fields", () => {
      const page: LegalPage = {
        slug: "terms",
        frontmatter: {
          title: "Test",
          description: "Test description",
          lastModified: "2026-01-28",
          locale: "ko",
        },
        content: "# Content",
      };
      expect(page.slug).toBe("terms");
      expect(page.frontmatter).toBeDefined();
      expect(page.content).toBe("# Content");
    });
  });

  describe("TocItem type", () => {
    it("has id and title fields", () => {
      const item: TocItem = {
        id: "test-section",
        title: "Test Section",
      };
      expect(item.id).toBe("test-section");
      expect(item.title).toBe("Test Section");
    });
  });
});
