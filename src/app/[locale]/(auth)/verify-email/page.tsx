import { getTranslations } from "next-intl/server";
import { VerifyEmailCard } from "@/features/auth";

export async function generateMetadata() {
  const t = await getTranslations("auth.verifyEmail");
  return { title: t("title"), description: t("description") };
}

export default function VerifyEmailPage() {
  return <VerifyEmailCard />;
}
