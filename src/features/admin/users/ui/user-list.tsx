"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Search } from "lucide-react";
import {
  Button,
  Badge,
  Skeleton,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";
import { useAdminUsers } from "../model/use-admin-users";

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0].toUpperCase();
}

export function UserList() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [inputValue, setInputValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setInputValue(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleRoleChange = useCallback((value: string) => {
    setRole(value === "all" ? undefined : value);
    setPage(1);
  }, []);

  const { users, total, pageSize, hasMore, isLoading } = useAdminUsers({
    search: debouncedSearch || undefined,
    role,
    page,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold tracking-tight">{t("users.title")}</h1>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("users.search")}
            value={inputValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select onValueChange={handleRoleChange} defaultValue="all">
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder={t("users.role")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("users.allRoles")}</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : users.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">{t("users.empty")}</p>
        </div>
      ) : (
        /* User table */
        <div className="rounded-lg border">
          {/* Header row */}
          <div className="hidden md:grid md:grid-cols-[1fr_1fr_100px_120px_100px] gap-4 border-b bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
            <div>{t("users.name")}</div>
            <div>{t("users.email")}</div>
            <div>{t("users.role")}</div>
            <div>{t("users.joinedAt")}</div>
            <div className="text-right">{t("users.enrolledCourses")}</div>
          </div>

          {/* Data rows */}
          {users.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-1 gap-2 border-b px-4 py-3 last:border-b-0 md:grid-cols-[1fr_1fr_100px_120px_100px] md:items-center md:gap-4"
            >
              {/* Name with avatar */}
              <div className="flex items-center gap-3">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {getInitials(user.name, user.email)}
                  </div>
                )}
                <span className="font-medium truncate">{user.name ?? "-"}</span>
                {/* Mobile: show role badge inline */}
                <Badge variant="outline" className="md:hidden">
                  {user.role}
                </Badge>
              </div>

              {/* Email */}
              <div className="text-sm text-muted-foreground truncate">{user.email}</div>

              {/* Role */}
              <div className="hidden md:block">
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
              </div>

              {/* Joined */}
              <div className="hidden text-sm text-muted-foreground md:block">
                {dateFormatter.format(new Date(user.createdAt))}
              </div>

              {/* Enrollment count */}
              <div className="hidden text-sm text-muted-foreground text-right md:block">
                {user.enrollmentCount}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            {tCommon("previous")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {tCommon("page", { current: page, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
          >
            {tCommon("next")}
          </Button>
        </div>
      )}
    </div>
  );
}
