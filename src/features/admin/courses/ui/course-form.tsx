"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/shared/ui";
import { createCourseSchema, updateCourseSchema } from "@/shared/lib/validations";

type CreateValues = z.output<typeof createCourseSchema>;

interface CourseFormProps {
  mode: "create" | "edit";
  courseId?: string;
  initialData?: Partial<CreateValues>;
  onSuccess?: (courseId: string) => void;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function CourseForm({ mode, courseId, initialData, onSuccess }: CourseFormProps) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const slugTouched = useRef(false);

  const form = useForm<CreateValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createCourseSchema) as any,
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      longDescription: "",
      price: 0,
      level: "beginner",
      category: "",
      thumbnailUrl: "",
      previewVideoUrl: "",
      instructorBio: "",
      isPublished: false,
      isFree: false,
      ...initialData,
    },
  });

  // Reset form when initialData changes (e.g., after fetch)
  useEffect(() => {
    if (initialData && mode === "edit") {
      form.reset({
        title: initialData.title ?? "",
        slug: initialData.slug ?? "",
        description: initialData.description ?? "",
        longDescription: initialData.longDescription ?? "",
        price: initialData.price ?? 0,
        level: initialData.level ?? "beginner",
        category: initialData.category ?? "",
        thumbnailUrl: initialData.thumbnailUrl ?? "",
        previewVideoUrl: initialData.previewVideoUrl ?? "",
        instructorBio: initialData.instructorBio ?? "",
        isPublished: initialData.isPublished ?? false,
        isFree: initialData.isFree ?? false,
      });
    }
  }, [initialData, mode, form]);

  // Auto-generate slug from title
  const title = form.watch("title");
  useEffect(() => {
    if (!slugTouched.current && mode === "create" && title) {
      form.setValue("slug", slugify(title));
    }
  }, [title, mode, form]);

  async function onSubmit(values: CreateValues) {
    try {
      // Clean up empty optional string fields - convert to undefined for create, null for update
      const cleaned = { ...values };
      const optionalStringFields = [
        "description",
        "longDescription",
        "category",
        "thumbnailUrl",
        "previewVideoUrl",
        "instructorBio",
      ] as const;

      for (const field of optionalStringFields) {
        if (cleaned[field] === "") {
          if (mode === "create") {
            delete (cleaned as Record<string, unknown>)[field];
          } else {
            (cleaned as Record<string, unknown>)[field] = null;
          }
        }
      }

      if (mode === "create") {
        const res = await fetch("/api/admin/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleaned),
        });
        const json = await res.json();
        if (!json.success) {
          toast.error(json.error?.message ?? "Failed to create course");
          return;
        }
        toast.success("Course created");
        onSuccess?.(json.data.id);
      } else {
        // For edit mode, validate with updateCourseSchema
        const editData: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(cleaned)) {
          if (value !== undefined) {
            editData[key] = value;
          }
        }
        const parsed = updateCourseSchema.safeParse(editData);
        if (!parsed.success) {
          toast.error("Validation error");
          return;
        }

        const res = await fetch(`/api/admin/courses/${courseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const json = await res.json();
        if (!json.success) {
          toast.error(json.error?.message ?? "Failed to update course");
          return;
        }
        toast.success("Course updated");
        onSuccess?.(courseId!);
      }
    } catch {
      toast.error("An unexpected error occurred");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? t("courses.create") : t("courses.edit")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Column 1: Text content fields */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("courses.form.title")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("courses.form.slug")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            slugTouched.current = true;
                            field.onChange(e);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("courses.form.shortDescription")}</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("courses.form.description")}</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={6} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instructorBio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructor Bio</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Column 2: Metadata and toggles */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("courses.form.price")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("courses.form.level")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("courses.form.category")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="thumbnailUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("courses.form.thumbnailUrl")}</FormLabel>
                      <FormControl>
                        <Input type="url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="previewVideoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("courses.form.previewVideoUrl")}</FormLabel>
                      <FormControl>
                        <Input type="url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>{t("courses.publish")}</FormLabel>
                        <FormDescription>
                          {field.value ? t("courses.published") : t("courses.unpublished")}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isFree"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Free Course</FormLabel>
                        <FormDescription>
                          {field.value ? "This course is free" : "This course is paid"}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? tCommon("loading")
                  : mode === "create"
                    ? t("courses.create")
                    : tCommon("save")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
