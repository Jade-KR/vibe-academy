import { getTranslations } from "next-intl/server";
import { ForgotPasswordForm } from "@/features/auth";

export async function generateMetadata() {
  const t = await getTranslations("auth.forgotPassword");
  return { title: t("title"), description: t("description") };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
