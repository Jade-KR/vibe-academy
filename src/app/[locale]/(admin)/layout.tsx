import { redirect } from "next/navigation";
import { createClient } from "@/shared/api/supabase/server";
import { db } from "@/db/client";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { AdminShell } from "@/widgets/admin-sidebar";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const [dbUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.supabaseUserId, user.id));

  if (!dbUser || dbUser.role !== "admin") {
    redirect(`/${locale}/dashboard`);
  }

  return <AdminShell>{children}</AdminShell>;
}
