import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/features/auth";

export async function generateMetadata() {
  const t = await getTranslations("auth.register");
  return { title: t("title"), description: t("description") };
}

export default function RegisterPage() {
  return <RegisterForm />;
}
