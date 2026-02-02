"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Link } from "@/i18n/navigation";

export function VerifyEmailCard() {
  const t = useTranslations("auth.verifyEmail");
  const tAuth = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast.success(t("resent"));
      } else {
        const data = await res.json();
        toast.error(data.error?.message ?? tAuth("unexpectedError"));
      }
    } catch {
      toast.error(tAuth("unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="resend-email">{tAuth("login.email")}</Label>
          <Input
            id="resend-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button onClick={handleResend} disabled={isLoading || !email} className="w-full">
          {t("resend")}
        </Button>
        <div className="text-center">
          <Link href="/login" className="text-sm text-primary hover:underline">
            {t("backToLogin")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
