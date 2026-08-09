import type { ReactNode } from "react";

import AdminShell from "@/components/AdminShell";
import { requireAdminAccess } from "@/lib/auth/require-admin-access";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({
  children,
}: AdminLayoutProps) {
  const access = await requireAdminAccess();

  return (
    <AdminShell
      role={access.role}
      email={access.email}
    >
      {children}
    </AdminShell>
  );
}