"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, Skeleton } from "@/shared/ui";
import { useAuth } from "@/shared/providers";
import { siteConfig, marketingNav } from "@/shared/config";
import { ThemeToggle } from "@/widgets/theme-toggle";
import { LanguageSwitcher } from "@/widgets/language-switcher";
import { NavLinks } from "./nav-links";
import { MobileNav } from "./mobile-nav";

export function Header() {
  const tNav = useTranslations("nav");
  const { user, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold">
            {siteConfig.name}
          </Link>
          <NavLinks items={[...marketingNav]} className="hidden md:flex" />
        </div>

        {/* Right: Actions */}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />

          {/* Auth CTAs (desktop) */}
          <div className="hidden md:flex md:items-center md:gap-2">
            {isLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : user ? (
              <Button variant="ghost" asChild>
                <Link href="/dashboard">{tNav("dashboard")}</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">{tNav("login")}</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">{tNav("register")}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
