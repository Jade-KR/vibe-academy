import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/features/auth";

export async function generateMetadata() {
  const t = await getTranslations("auth.login");
  return { title: t("title"), description: t("description") };
}

export default function LoginPage() {
  return <LoginForm />;
}
