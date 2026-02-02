/**
 * Navigation item definition.
 * Labels use i18n translation keys (e.g., "nav.home") rather than hardcoded strings.
 */
export interface NavItem {
  /** Unique key for this navigation item */
  key: string;
  /** Route path (without locale prefix) */
  href: string;
  /** i18n translation key for the label */
  labelKey: string;
  /** Optional icon name (for dashboard nav) */
  icon?: string;
  /** Child navigation items (for sub-menus) */
  children?: NavItem[];
}

/**
 * Marketing site navigation (public pages).
 * Displayed in the marketing header/navbar.
 */
export const marketingNav: NavItem[] = [
  { key: "home", href: "/", labelKey: "nav.home" },
  { key: "courses", href: "/courses", labelKey: "nav.courses" },
  { key: "reviews", href: "/reviews", labelKey: "nav.reviews" },
  { key: "contact", href: "/contact", labelKey: "nav.contact" },
] as const;

/**
 * Auth navigation items shown to unauthenticated users.
 * Displayed in the marketing header for login/register CTAs.
 */
export const authNav: NavItem[] = [
  { key: "login", href: "/login", labelKey: "nav.login" },
  { key: "register", href: "/register", labelKey: "nav.register" },
] as const;

/**
 * Dashboard navigation (protected pages).
 * Displayed in the dashboard sidebar/top bar.
 */
export const dashboardNav: NavItem[] = [
  {
    key: "dashboard",
    href: "/dashboard",
    labelKey: "nav.myCourses",
    icon: "BookOpen",
  },
  {
    key: "settings",
    href: "/dashboard/settings",
    labelKey: "nav.settings",
    icon: "Settings",
    children: [
      {
        key: "settings-profile",
        href: "/dashboard/settings/profile",
        labelKey: "nav.settingsProfile",
        icon: "User",
      },
      {
        key: "settings-account",
        href: "/dashboard/settings/account",
        labelKey: "nav.settingsAccount",
        icon: "Shield",
      },
    ],
  },
] as const;

/**
 * Routes that require authentication.
 * Used by middleware for route protection.
 */
export const protectedRoutes = ["/dashboard", "/learn", "/admin"] as const;

/**
 * Routes only accessible to unauthenticated users.
 * Authenticated users are redirected to dashboard.
 */
export const authOnlyRoutes = [
  "/login",
  "/register",
  "/forgot-password",
] as const;

export type ProtectedRoute = (typeof protectedRoutes)[number];
export type AuthOnlyRoute = (typeof authOnlyRoutes)[number];
