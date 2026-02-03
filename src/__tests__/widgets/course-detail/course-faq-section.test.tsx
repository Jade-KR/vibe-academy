import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CourseFaqSection } from "@/widgets/course-detail/ui/course-faq-section";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations:
    () =>
    (key: string, _params?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        "faq.title": "Frequently Asked Questions",
        "detail.faq.items.0.q": "Is there a time limit?",
        "detail.faq.items.0.a": "No, lifetime access.",
        "detail.faq.items.1.q": "How to get a refund?",
        "detail.faq.items.1.a": "Within 7 days.",
        "detail.faq.items.2.q": "Certificate?",
        "detail.faq.items.2.a": "Yes.",
        "detail.faq.items.3.q": "Where to ask?",
        "detail.faq.items.3.a": "Discussion panel.",
      };
      return map[key] ?? key;
    },
}));

describe("CourseFaqSection", () => {
  it("renders FAQ title", () => {
    render(<CourseFaqSection />);
    expect(screen.getByText("Frequently Asked Questions")).toBeInTheDocument();
  });

  it("renders all 4 FAQ questions", () => {
    render(<CourseFaqSection />);
    expect(screen.getByText("Is there a time limit?")).toBeInTheDocument();
    expect(screen.getByText("How to get a refund?")).toBeInTheDocument();
    expect(screen.getByText("Certificate?")).toBeInTheDocument();
    expect(screen.getByText("Where to ask?")).toBeInTheDocument();
  });
});
