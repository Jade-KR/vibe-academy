"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { registerSchema } from "@/shared/lib/validations";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Link } from "@/i18n/navigation";
import { SocialLoginButtons } from "@/features/auth/social-login";
import { useRegister } from "../model/use-register";

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const t = useTranslations("auth.register");
  const { handleRegister, isLoading } = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", name: "" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleRegister)}
            noValidate
            className="space-y-4"
            aria-busy={isLoading}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input type="text" autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("password")}</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("confirmPassword")}</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
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

        <SocialLoginButtons disabled={isLoading} className="mt-6" />

        <div className="mt-4 text-center text-sm">
          <span>{t("hasAccount")} </span>
          <Link href="/login" className="text-primary hover:underline">
            {t("login")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
