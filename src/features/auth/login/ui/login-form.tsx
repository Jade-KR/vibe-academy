"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { loginSchema } from "@/shared/lib/validations";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Checkbox } from "@/shared/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Link } from "@/i18n/navigation";
import { SocialLoginButtons } from "@/features/auth/social-login";
import { useLogin } from "../model/use-login";

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const t = useTranslations("auth.login");
  const { handleLogin, isLoading } = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (data: LoginFormValues) => {
    await handleLogin(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("password")}</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="rememberMe"
                    />
                  </FormControl>
                  <FormLabel htmlFor="rememberMe" className="!mt-0 cursor-pointer">
                    {t("rememberMe")}
                  </FormLabel>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {t("submit")}
            </Button>
          </form>
        </Form>

        <SocialLoginButtons disabled={isLoading} className="mt-6" />

        <div className="mt-4 flex justify-between text-sm">
          <Link href="/forgot-password" className="text-primary hover:underline">
            {t("forgotPassword")}
          </Link>
          <Link href="/register" className="text-primary hover:underline">
            {t("register")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
