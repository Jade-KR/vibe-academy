"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ArrowLeft,
  Menu,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { isActiveRoute } from "@/shared/lib/is-active-route";
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Separator,
} from "@/shared/ui";
import { adminNav } from "@/shared/config";
import type { NavItem } from "@/shared/config";
import { ThemeToggle } from "@/widgets/theme-toggle";
import { LanguageSwitcher } from "@/widgets/language-switcher";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  BookOpen,
};

function getIcon(name?: string): LucideIcon | undefined {
  if (!name) return undefined;
  return iconMap[name];
}

function SidebarNavItem({
  item,
  pathname,
  t,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  t: (key: string) => string;
  onClick?: () => void;
}) {
  const Icon = getIcon(item.icon);
  const active = isActiveRoute(pathname, item.href, item.href === "/admin");

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted/50",
        active ? "bg-muted/50 font-medium text-foreground" : "text-muted-foreground",
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {t(item.labelKey)}
    </Link>
  );
}

function SidebarContent({
  pathname,
  t,
  onNavClick,
}: {
  pathname: string;
  t: (key: string) => string;
  onNavClick?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/admin" className="text-lg font-bold" onClick={onNavClick}>
          {t("admin.title")}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {adminNav.map((item) => (
          <SidebarNavItem
            key={item.key}
            item={item}
            pathname={pathname}
            t={t}
            onClick={onNavClick}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t px-3 py-4 space-y-2">
        <Link
          href="/dashboard"
          onClick={onNavClick}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("nav.dashboard")}
        </Link>
        <Separator />
        <div className="flex items-center gap-2 px-3 pt-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden border-r bg-card md:block transition-all duration-200",
          collapsed ? "w-0 overflow-hidden" : "w-64",
        )}
      >
        <div className="fixed top-0 h-screen w-64 overflow-y-auto">
          <SidebarContent pathname={pathname} t={t} />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          {/* Desktop collapse button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label={t("nav.menu")}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>{t("admin.title")}</SheetTitle>
              </SheetHeader>
              <SidebarContent pathname={pathname} t={t} onNavClick={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

          {/* Desktop top-right actions */}
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
