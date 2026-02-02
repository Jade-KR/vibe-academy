"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { User, Shield, LogOut } from "lucide-react";
import {
  Button,
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Skeleton,
} from "@/shared/ui";
import { useAuth } from "@/shared/providers";

export function UserMenu() {
  const { user, isLoading, signOut } = useAuth();
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const router = useRouter();

  if (isLoading) {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }

  if (!user) {
    return null;
  }

  const userInitial = user.email?.[0]?.toUpperCase() ?? "U";

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label={tNav("menu")}>
          <Avatar className="h-8 w-8">
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            {tNav("settingsProfile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings/account" className="flex items-center">
            <Shield className="mr-2 h-4 w-4" />
            {tNav("settingsAccount")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          {tAuth("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
