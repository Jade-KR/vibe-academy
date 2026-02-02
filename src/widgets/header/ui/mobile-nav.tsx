"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Separator,
} from "@/shared/ui";
import { useAuth } from "@/shared/providers";
import { siteConfig, marketingNav, authNav } from "@/shared/config";
import { isActiveRoute } from "@/shared/lib/is-active-route";
import type { NavItem } from "@/shared/config";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const t = useTranslations();
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  function renderNavItem(item: NavItem) {
    return (
      <Link
        key={item.key}
        href={item.href}
        onClick={() => setOpen(false)}
        className={cn(
          "block py-2 text-sm transition-colors hover:text-foreground",
          isActiveRoute(pathname, item.href)
            ? "font-medium text-foreground"
            : "text-muted-foreground",
        )}
      >
        {t(item.labelKey)}
      </Link>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
          {marketingNav.map(renderNavItem)}
          <Separator className="my-3" />
          {!isLoading && (
            <>
              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="block py-2 text-sm font-medium text-foreground transition-colors hover:text-foreground"
                >
                  {tNav("dashboard")}
                </Link>
              ) : (
                authNav.map(renderNavItem)
              )}
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
