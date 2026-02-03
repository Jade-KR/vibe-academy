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
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/shared/ui";
const chapterFormSchema = z.object({
  title: z.string().min(1).max(200),
});

type ChapterFormValues = z.infer<typeof chapterFormSchema>;

interface ChapterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialTitle?: string;
  onSubmit: (title: string) => Promise<void>;
}

export function ChapterDialog({
  open,
  onOpenChange,
  mode,
  initialTitle = "",
  onSubmit,
}: ChapterDialogProps) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");

  const form = useForm<ChapterFormValues>({
    resolver: zodResolver(chapterFormSchema),
    defaultValues: { title: initialTitle },
  });

  useEffect(() => {
    if (open) {
      form.reset({ title: initialTitle });
    }
  }, [open, initialTitle, form]);

  async function handleSubmit(values: ChapterFormValues) {
    await onSubmit(values.title);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? t("chapters.add") : t("chapters.edit")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("chapters.form.title")}</FormLabel>
                  <FormControl>
                    <Input {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
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
                    ? t("chapters.add")
                    : tCommon("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
