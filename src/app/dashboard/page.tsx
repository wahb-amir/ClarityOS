import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/ui/NavBar";
import { DashboardClient } from "@/components/sections/DashboardClient";

export const metadata = { title: "My Projects" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "dev") redirect("/admin");

  return (
    <div className="min-h-screen bg-bg-base">
      <NavBar
        role={session.user.role}
        userName={session.user.name ?? undefined}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            My Projects
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Welcome back, {session.user.name?.split(" ")[0] ?? "there"}
          </p>
        </div>
        <DashboardClient />
      </div>
    </div>
  );
}
