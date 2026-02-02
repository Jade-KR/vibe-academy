"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { forgotPasswordSchema } from "@/shared/lib/validations";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Link } from "@/i18n/navigation";
import { useForgotPassword } from "../model/use-forgot-password";

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const { handleForgotPassword, isLoading, isSent } = useForgotPassword();

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  if (isSent) {
    return (
      <Card aria-live="polite">
        <CardHeader>
          <CardTitle>{t("sent")}</CardTitle>
          <CardDescription>{t("sentDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className="text-sm text-primary hover:underline">
            {t("backToLogin")}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleForgotPassword)}
            noValidate
            className="space-y-4"
            aria-busy={isLoading}
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {t("submit")}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-primary hover:underline">
            {t("backToLogin")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
