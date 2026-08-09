import { requireAdminAccess } from "@/lib/auth/require-admin-access";

export default async function AdminPage() {
  const access = await requireAdminAccess();

  return (
    <main>
      <h1>Panel administrativo</h1>
      <p>Acceso autorizado como: {access.role}</p>
    </main>
  );
}