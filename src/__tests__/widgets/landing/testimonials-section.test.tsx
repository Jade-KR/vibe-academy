import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("TestimonialsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders section heading with testimonials title key", async () => {
    const { TestimonialsSection } = await import("@/widgets/landing/ui/testimonials-section");
    render(<TestimonialsSection />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("testimonials.title");
  });

  it("renders subtitle", async () => {
    const { TestimonialsSection } = await import("@/widgets/landing/ui/testimonials-section");
    render(<TestimonialsSection />);
    expect(screen.getByText("testimonials.subtitle")).toBeInTheDocument();
  });

  it("renders 3 testimonial cards", async () => {
    const { TestimonialsSection } = await import("@/widgets/landing/ui/testimonials-section");
    render(<TestimonialsSection />);

    for (let i = 0; i < 3; i++) {
      expect(screen.getByText(`testimonials.items.${i}.name`)).toBeInTheDocument();
    }
  });

  it("each card has quote, name, and role translation keys", async () => {
    const { TestimonialsSection } = await import("@/widgets/landing/ui/testimonials-section");
    render(<TestimonialsSection />);

    for (let i = 0; i < 3; i++) {
      expect(screen.getByText(`testimonials.items.${i}.quote`)).toBeInTheDocument();
      expect(screen.getByText(`testimonials.items.${i}.name`)).toBeInTheDocument();
      expect(screen.getByText(`testimonials.items.${i}.role`)).toBeInTheDocument();
    }
  });

  it("cards use blockquote semantic element", async () => {
    const { TestimonialsSection } = await import("@/widgets/landing/ui/testimonials-section");
    render(<TestimonialsSection />);

    const blockquotes = document.querySelectorAll("blockquote");
    expect(blockquotes).toHaveLength(3);
  });
});
