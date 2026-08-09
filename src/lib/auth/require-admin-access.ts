import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type StaffRole =
  | "support"
  | "moderator"
  | "admin"
  | "superadmin";

interface AdminAccess {
  userId: string;
  email: string | null;
  role: StaffRole;
}

export async function requireAdminAccess(): Promise<AdminAccess> {
  const supabase = await createClient();

    const {
    data: claimsData,
    error: claimsError,
    } = await supabase.auth.getClaims();

    const claims = claimsData?.claims;
    const userId = claims?.sub;

  if (claimsError || !userId) {
    redirect("/iniciar-sesion?error=sesion-requerida");
  }

  const [roleResult, permissionResult] = await Promise.all([
    supabase.rpc("current_app_role"),
    supabase.rpc("has_permission", {
      target_permission: "dashboard.view",
    }),
  ]);

  if (roleResult.error || permissionResult.error) {
    console.error("[admin/access] Error al validar permisos:", {
      roleCode: roleResult.error?.code,
      permissionCode: permissionResult.error?.code,
    });

    redirect("/?error=verificacion-administrativa");
  }

  const role = roleResult.data as StaffRole | null;
  const canViewDashboard = permissionResult.data === true;

  if (!role || !canViewDashboard) {
    redirect("/?error=acceso-denegado");
  }

  return {
    userId,
    email:
      typeof claims.email === "string"
        ? claims.email
        : null,
    role,
  };
}