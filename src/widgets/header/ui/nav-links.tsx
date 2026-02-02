"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { isActiveRoute } from "@/shared/lib/is-active-route";
import type { NavItem } from "@/shared/config";

interface NavLinksProps {
  items: NavItem[];
  className?: string;
}

export function NavLinks({ items, className }: NavLinksProps) {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center gap-6", className)}>
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={cn(
            "text-sm transition-colors hover:text-foreground",
            isActiveRoute(pathname, item.href)
              ? "font-medium text-foreground"
              : "text-muted-foreground",
          )}
        >
          {t(item.labelKey)}
        </Link>
      ))}
    </nav>
  );
}
