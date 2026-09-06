import { NextResponse, type NextRequest } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_REDIRECTS = new Set([
  "/publicar",
  "/completar-perfil",
  "/actualizar-contrasena",
]);

const STAFF_ROLES = new Set([
  "support",
  "moderator",
  "admin",
  "superadmin",
]);

function getSafeRedirect(value: string | null): string {
  if (value && ALLOWED_REDIRECTS.has(value)) {
    return value;
  }

  return "/publicar";
}

function createRedirect(
  request: NextRequest,
  pathname: string,
  error?: string,
) {
  const redirectUrl = request.nextUrl.clone();

  redirectUrl.pathname = pathname;
  redirectUrl.search = "";
  redirectUrl.hash = "";

  if (error) {
    redirectUrl.searchParams.set("error", error);
  }

  const response = NextResponse.redirect(redirectUrl);

  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Pragma", "no-cache");

  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  const requestedPath = getSafeRedirect(
    request.nextUrl.searchParams.get("next"),
  );

  if (!code) {
    return createRedirect(
      request,
      "/iniciar-sesion",
      "confirmacion",
    );
  }

  const supabase = await createClient();

  const {
    data: sessionData,
    error: sessionError,
  } = await supabase.auth.exchangeCodeForSession(code);

  const authenticatedUserId = sessionData.user?.id;

  if (sessionError || !authenticatedUserId) {
    return createRedirect(
      request,
      "/iniciar-sesion",
      "confirmacion",
    );
  }

  // La recuperación de contraseña conserva su flujo propio.
  if (requestedPath === "/actualizar-contrasena") {
    return createRedirect(request, requestedPath);
  }

  const { data: roleRecord, error: roleError } =
    await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", authenticatedUserId)
      .maybeSingle();

  if (roleError) {
    console.error(
      "[auth/callback] No se pudo comprobar el rol:",
      roleError.code,
    );

    await supabase.auth.signOut();

    return createRedirect(
      request,
      "/iniciar-sesion",
      "permisos",
    );
  }

  const isStaff =
    typeof roleRecord?.role === "string" &&
    STAFF_ROLES.has(roleRecord.role);

  if (isStaff) {
    const {
      data: assuranceData,
      error: assuranceError,
    } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (assuranceError) {
      console.error(
        "[auth/callback] No se pudo comprobar MFA:",
        assuranceError.message,
      );

      await supabase.auth.signOut();

      return createRedirect(
        request,
        "/iniciar-sesion",
        "mfa",
      );
    }

    if (
      assuranceData.currentLevel === "aal2" &&
      assuranceData.nextLevel === "aal2"
    ) {
      return createRedirect(request, "/admin");
    }

    if (assuranceData.nextLevel === "aal2") {
      return createRedirect(
        request,
        "/verificar-mfa",
      );
    }

    return createRedirect(
      request,
      "/configurar-mfa",
    );
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", authenticatedUserId)
      .maybeSingle();

  if (profileError) {
    console.error(
      "[auth/callback] No se pudo verificar el perfil:",
      profileError.code,
    );

    return createRedirect(
      request,
      "/iniciar-sesion",
      "perfil",
    );
  }

  const destination = profile?.onboarding_completed_at
    ? "/publicar"
    : "/completar-perfil";

  return createRedirect(request, destination);
}