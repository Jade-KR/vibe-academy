"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Textarea,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/shared/ui";
import { createDiscussionSchema } from "@/shared/lib/validations";

type CreateFormValues = z.infer<typeof createDiscussionSchema>;

interface DiscussionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  editData?: { id: string; title: string; content: string };
  onSuccess: () => void;
}

export function DiscussionFormDialog({
  open,
  onOpenChange,
  lessonId,
  editData,
  onSuccess,
}: DiscussionFormDialogProps) {
  const t = useTranslations("discussion");
  const tc = useTranslations("common");
  const isEdit = Boolean(editData);

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createDiscussionSchema),
    defaultValues: {
      title: editData?.title ?? "",
      content: editData?.content ?? "",
    },
  });

  // Reset form when dialog opens/closes or editData changes
  useEffect(() => {
    if (open) {
      form.reset({
        title: editData?.title ?? "",
        content: editData?.content ?? "",
      });
    }
  }, [open, editData, form]);

  const onSubmit = async (values: CreateFormValues) => {
    try {
      const url = isEdit
        ? `/api/discussions/${editData!.id}`
        : `/api/lessons/${lessonId}/discussions`;
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(isEdit ? t("update") : t("submit"));
      onSuccess();
    } catch {
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editPost") : t("newPost")}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("postTitle")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("postTitlePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("postContent")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("postContentPlaceholder")}
                      className="min-h-[120px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                {isEdit ? t("update") : t("submit")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
