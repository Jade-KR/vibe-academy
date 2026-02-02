"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LayoutDashboard, Settings, User, Shield, Menu, LogOut, ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { isActiveRoute } from "@/shared/lib/is-active-route";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Separator,
} from "@/shared/ui";
import { useAuth } from "@/shared/providers";
import { siteConfig, dashboardNav } from "@/shared/config";
import type { NavItem } from "@/shared/config";
import { ThemeToggle } from "@/widgets/theme-toggle";
import { LanguageSwitcher } from "@/widgets/language-switcher";
import { UserMenu } from "./user-menu";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Settings,
  User,
  Shield,
  LogOut,
};

function getIcon(name?: string): LucideIcon | undefined {
  if (!name) return undefined;
  return iconMap[name];
}

function DashboardNavItem({
  item,
  pathname,
  t,
}: {
  item: NavItem;
  pathname: string;
  t: (key: string) => string;
}) {
  const Icon = getIcon(item.icon);

  // Item with children renders as dropdown
  if (item.children && item.children.length > 0) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "flex items-center gap-1 text-sm transition-colors",
              isActiveRoute(pathname, item.href)
                ? "font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {Icon ? <Icon className="mr-1 h-4 w-4" /> : null}
            {t(item.labelKey)}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {item.children.map((child) => {
            const ChildIcon = getIcon(child.icon);
            return (
              <DropdownMenuItem key={child.key} asChild>
                <Link href={child.href} className="flex items-center">
                  {ChildIcon ? <ChildIcon className="mr-2 h-4 w-4" /> : null}
                  {t(child.labelKey)}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Simple nav link
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-1 text-sm transition-colors hover:text-foreground",
        isActiveRoute(pathname, item.href)
          ? "font-medium text-foreground"
          : "text-muted-foreground",
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {t(item.labelKey)}
    </Link>
  );
}

export function TopBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations();
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold">
            {siteConfig.name}
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            {dashboardNav.map((item) => (
              <DashboardNavItem key={item.key} item={item} pathname={pathname} t={t} />
            ))}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          <UserMenu />

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label={tNav("menu")}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left">{siteConfig.name}</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {dashboardNav.map((item) => {
                  const Icon = getIcon(item.icon);
                  return (
                    <div key={item.key}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-2 py-2 text-sm transition-colors hover:text-foreground",
                          isActiveRoute(pathname, item.href)
                            ? "font-medium text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {Icon ? <Icon className="h-4 w-4" /> : null}
                        {t(item.labelKey)}
                      </Link>
                      {item.children?.map((child) => {
                        const ChildIcon = getIcon(child.icon);
                        return (
                          <Link
                            key={child.key}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-2 py-2 pl-6 text-sm transition-colors hover:text-foreground",
                              isActiveRoute(pathname, child.href)
                                ? "font-medium text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {ChildIcon ? <ChildIcon className="h-4 w-4" /> : null}
                            {t(child.labelKey)}
                          </Link>
                        );
                      })}
                    </div>
                  );
                })}
                <Separator className="my-3" />
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    setMobileOpen(false);
                  }}
                  className="flex items-center gap-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  {tAuth("logout")}
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
