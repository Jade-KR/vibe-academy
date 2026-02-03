"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button, Textarea, Form, FormField, FormItem, FormControl, FormMessage } from "@/shared/ui";
import { createCommentSchema } from "@/shared/lib/validations";

type CommentFormValues = z.infer<typeof createCommentSchema>;

interface CommentFormProps {
  discussionId: string;
  editData?: { id: string; content: string };
  onSuccess: () => void;
  onCancel?: () => void;
}

export function CommentForm({ discussionId, editData, onSuccess, onCancel }: CommentFormProps) {
  const t = useTranslations("discussion");
  const tc = useTranslations("common");
  const isEdit = Boolean(editData);

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: {
      content: editData?.content ?? "",
    },
  });

  // Reset form when editData changes
  useEffect(() => {
    form.reset({
      content: editData?.content ?? "",
    });
  }, [editData, form]);

  const onSubmit = async (values: CommentFormValues) => {
    try {
      const url = isEdit
        ? `/api/comments/${editData!.id}`
        : `/api/discussions/${discussionId}/comments`;
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

      toast.success(isEdit ? t("editComment") : t("writeComment"));
      form.reset({ content: "" });
      onSuccess();
    } catch {
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder={t("commentPlaceholder")}
                  className="min-h-[80px] resize-y text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel ? (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              {tc("cancel")}
            </Button>
          ) : null}
          <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" aria-hidden="true" />
            ) : null}
            {isEdit ? t("update") : t("submit")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
