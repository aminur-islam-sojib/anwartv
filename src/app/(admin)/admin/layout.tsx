import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/login");

  return (
    <div className="admin-shell">
      {/* sidebar, etc. — you have session.user.role available here */}
      {children}
    </div>
  );
}
