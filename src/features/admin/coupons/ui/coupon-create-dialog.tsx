"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/shared/ui";
import { createCouponSchema } from "@/shared/lib/validations";
import { useAdminCourses } from "@/features/admin/courses";

type CouponFormValues = z.infer<typeof createCouponSchema>;

interface CouponCreateDialogProps {
  onSuccess: () => void;
}

export function CouponCreateDialog({ onSuccess }: CouponCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const { courses } = useAdminCourses();

  const form = useForm<CouponFormValues>({
    // zodResolver type mismatch with react-hook-form + zod v4 is a known upstream issue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createCouponSchema) as any,
    defaultValues: {
      code: "",
      discount: 0,
      discountType: "fixed",
      courseId: null,
      maxUses: null,
      expiresAt: null,
    },
  });

  async function onSubmit(values: CouponFormValues) {
    try {
      // Convert empty optional fields to null
      const payload = {
        ...values,
        courseId: values.courseId || null,
        maxUses: values.maxUses || null,
        expiresAt: values.expiresAt || null,
      };

      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? t("coupons.createFailed"));
        return;
      }
      toast.success(t("coupons.created"));
      setOpen(false);
      form.reset();
      onSuccess();
    } catch {
      toast.error(t("unexpectedError"));
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {t("coupons.create")}
      </Button>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("coupons.create")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Code */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("coupons.code")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="SUMMER2026"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Discount + Type in a row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("coupons.discountAmount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
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
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("coupons.discountType")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixed">{t("coupons.discountFixed")}</SelectItem>
                        <SelectItem value="percentage">{t("coupons.discountPercent")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Course selector */}
            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("coupons.appliesTo")}</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === "__all__" ? null : v)}
                    value={field.value ?? "__all__"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__all__">{t("coupons.allCourses")}</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Max uses + Expires in a row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxUses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("coupons.maxUses")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder={t("coupons.unlimited")}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val ? Number(val) : null);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("coupons.validUntil")}</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          // Convert datetime-local to ISO string for zod
                          field.onChange(val ? new Date(val).toISOString() : null);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? tCommon("loading") : t("coupons.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
