"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Textarea,
  Switch,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/shared/ui";

const lessonFormSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  videoUrl: z.string().max(500).optional(),
  duration: z.number().int().min(0).optional(),
  isPreview: z.boolean().default(false),
});

type LessonFormValues = z.output<typeof lessonFormSchema>;

interface LessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: Partial<LessonFormValues>;
  onSubmit: (data: LessonFormValues) => Promise<void>;
}

export function LessonDialog({
  open,
  onOpenChange,
  mode,
  initialData,
  onSubmit,
}: LessonDialogProps) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");

  const form = useForm<LessonFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(lessonFormSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      videoUrl: "",
      duration: 0,
      isPreview: false,
      ...initialData,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: initialData?.title ?? "",
        description: initialData?.description ?? "",
        videoUrl: initialData?.videoUrl ?? "",
        duration: initialData?.duration ?? 0,
        isPreview: initialData?.isPreview ?? false,
      });
    }
  }, [open, initialData, form]);

  async function handleSubmit(values: LessonFormValues) {
    // Clean empty strings to undefined
    const cleaned: Record<string, unknown> = { title: values.title };
    if (values.description) cleaned.description = values.description;
    if (values.videoUrl) cleaned.videoUrl = values.videoUrl;
    if (values.duration && values.duration > 0) cleaned.duration = values.duration;
    cleaned.isPreview = values.isPreview;

    await onSubmit(cleaned as LessonFormValues);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? t("lessons.add") : t("lessons.edit")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("lessons.form.title")}</FormLabel>
                  <FormControl>
                    <Input {...field} autoFocus />
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
                  <FormLabel>{t("lessons.form.description")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("lessons.form.videoUrl")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("lessons.form.duration")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPreview"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t("lessons.isPreview")}</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? tCommon("loading")
                  : mode === "create"
                    ? t("lessons.add")
                    : tCommon("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
