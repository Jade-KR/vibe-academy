import { redirect } from "next/navigation";
import { createClient } from "@/shared/api/supabase/server";
import { TopBar } from "@/widgets/top-bar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // const supabase = await createClient();
  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();

  // if (!user) {
  //   redirect("/login");
  // }

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-6">{children}</main>
    </div>
  );
}
