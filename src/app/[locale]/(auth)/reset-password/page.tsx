import { getTranslations } from "next-intl/server";
import { ResetPasswordForm } from "@/features/auth";

export async function generateMetadata() {
  const t = await getTranslations("auth.resetPassword");
  return { title: t("title"), description: t("description") };
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
