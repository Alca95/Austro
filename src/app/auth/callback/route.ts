import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

const ALLOWED_REDIRECTS = new Set([
  "/publicar",
  "/completar-perfil",
  "/actualizar-contrasena",
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

  if (sessionError || !sessionData.user) {
    return createRedirect(
      request,
      "/iniciar-sesion",
      "confirmacion",
    );
  }

  // La recuperación de contraseña no depende del estado del perfil.
  if (requestedPath === "/actualizar-contrasena") {
    return createRedirect(request, requestedPath);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", sessionData.user.id)
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