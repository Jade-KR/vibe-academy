import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

export default async function SettingsPage() {
  const locale = await getLocale();
  redirect(`/${locale}/dashboard/settings/profile`);
}
