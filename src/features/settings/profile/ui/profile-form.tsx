"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { useProfile } from "../model/use-profile";

const updateProfileFormSchema = z.object({
  name: z.string().max(100).optional(),
  locale: z.enum(["ko", "en"]),
});

type ProfileFormValues = z.infer<typeof updateProfileFormSchema>;

export function ProfileForm() {
  const t = useTranslations("settings.profile");
  const { profile, isLoading, updateProfile } = useProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(updateProfileFormSchema),
    defaultValues: {
      name: "",
      locale: "en",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name ?? "",
        locale: (profile.locale as "ko" | "en") ?? "en",
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    await updateProfile(data);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent data-testid="profile-form-skeleton" className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
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
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
            aria-busy={form.formState.isSubmitting}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("namePlaceholder")} autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="locale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("locale")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ko">한국어</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {t("submit")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
