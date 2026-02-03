import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PurchaseWidget } from "@/widgets/course-detail/ui/purchase-widget";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations:
    () =>
    (key: string, _params?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        free: "Free",
        currency: "KRW",
        continueLearning: "Continue Learning",
        includes: "This course includes",
        lifetimeAccess: "Lifetime access",
        certificate: "Certificate",
        discussionAccess: "Discussion access",
        "detail.purchaseWidget.title": "Course Info",
        "detail.purchaseWidget.enrollFree": "Enroll Free",
        "detail.purchaseWidget.enrollPaid": "Purchase Course",
        "detail.purchaseWidget.loginRequired": "Login to Enroll",
        "detail.purchaseWidget.processing": "Processing...",
      };
      return map[key] ?? key;
    },
}));

// Mock i18n navigation
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockCourse = {
  id: "1",
  title: "React Fundamentals",
  slug: "react-fundamentals",
  description: "Learn React",
  longDescription: null,
  price: 0,
  level: "beginner" as const,
  category: "frontend-basic",
  thumbnailUrl: null,
  previewVideoUrl: null,
  instructorBio: null,
  isFree: true,
  isPublished: true,
  polarProductId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  chapters: [],
  totalLessons: 10,
  totalDuration: 3600,
  reviewCount: 5,
  averageRating: 4.0,
};

const mockUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  avatarUrl: null,
  locale: "ko",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("PurchaseWidget (desktop)", () => {
  it("shows 'Login to Enroll' when user is not authenticated", () => {
    render(
      <PurchaseWidget
        course={mockCourse}
        enrolled={false}
        isAuthLoading={false}
        user={null}
        onCheckout={vi.fn()}
        checkoutLoading={false}
        variant="desktop"
      />,
    );
    expect(screen.getByText("Login to Enroll")).toBeInTheDocument();
  });

  it("shows 'Enroll Free' for free course when authenticated", () => {
    render(
      <PurchaseWidget
        course={mockCourse}
        enrolled={false}
        isAuthLoading={false}
        user={mockUser}
        onCheckout={vi.fn()}
        checkoutLoading={false}
        variant="desktop"
      />,
    );
    expect(screen.getByText("Enroll Free")).toBeInTheDocument();
  });

  it("shows 'Purchase Course' for paid course when authenticated", () => {
    render(
      <PurchaseWidget
        course={{ ...mockCourse, isFree: false, price: 50000 }}
        enrolled={false}
        isAuthLoading={false}
        user={mockUser}
        onCheckout={vi.fn()}
        checkoutLoading={false}
        variant="desktop"
      />,
    );
    expect(screen.getByText("Purchase Course")).toBeInTheDocument();
    expect(screen.getByText(/50,000/)).toBeInTheDocument();
  });

  it("shows 'Continue Learning' when enrolled", () => {
    render(
      <PurchaseWidget
        course={mockCourse}
        enrolled={true}
        isAuthLoading={false}
        user={mockUser}
        onCheckout={vi.fn()}
        checkoutLoading={false}
        variant="desktop"
      />,
    );
    expect(screen.getByText("Continue Learning")).toBeInTheDocument();
  });

  it("shows includes list in desktop variant", () => {
    render(
      <PurchaseWidget
        course={mockCourse}
        enrolled={false}
        isAuthLoading={false}
        user={null}
        onCheckout={vi.fn()}
        checkoutLoading={false}
        variant="desktop"
      />,
    );
    expect(screen.getByText("Lifetime access")).toBeInTheDocument();
    expect(screen.getByText("Certificate")).toBeInTheDocument();
    expect(screen.getByText("Discussion access")).toBeInTheDocument();
  });

  it("shows 'Free' for free courses", () => {
    render(
      <PurchaseWidget
        course={mockCourse}
        enrolled={false}
        isAuthLoading={false}
        user={null}
        onCheckout={vi.fn()}
        checkoutLoading={false}
        variant="desktop"
      />,
    );
    expect(screen.getByText("Free")).toBeInTheDocument();
  });
});

describe("PurchaseWidget (mobile)", () => {
  it("renders price and CTA in mobile variant", () => {
    render(
      <PurchaseWidget
        course={mockCourse}
        enrolled={false}
        isAuthLoading={false}
        user={null}
        onCheckout={vi.fn()}
        checkoutLoading={false}
        variant="mobile"
      />,
    );
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Login to Enroll")).toBeInTheDocument();
  });
});
