import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_PATH = "/iniciar-sesion";
const PUBLISH_PATH = "/publicar";
const PROFILE_PATH = "/completar-perfil";
const ADMIN_PATH = "/admin";
const MFA_SETUP_PATH = "/configurar-mfa";
const MFA_VERIFY_PATH = "/verificar-mfa";

function matchesPath(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function redirectWithCookies(
  request: NextRequest,
  sourceResponse: NextResponse,
  pathname: string,
  error?: string,
) {
  const url = request.nextUrl.clone();

  url.pathname = pathname;
  url.search = "";
  url.hash = "";

  if (error) {
    url.searchParams.set("error", error);
  }

  const redirectResponse = NextResponse.redirect(url);

  sourceResponse.cookies
    .getAll()
    .forEach(({ name, value, ...options }) => {
      redirectResponse.cookies.set(name, value, options);
    });

  redirectResponse.headers.set(
    "Cache-Control",
    "private, no-store",
  );
  redirectResponse.headers.set("Pragma", "no-cache");

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(name, value, options);
            },
          );
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;

  const isPublishRoute = matchesPath(
    pathname,
    PUBLISH_PATH,
  );
  const isProfileRoute = matchesPath(
    pathname,
    PROFILE_PATH,
  );
  const isAdminRoute = matchesPath(
    pathname,
    ADMIN_PATH,
  );
  const isMfaSetupRoute = matchesPath(
    pathname,
    MFA_SETUP_PATH,
  );
  const isMfaVerifyRoute = matchesPath(
    pathname,
    MFA_VERIFY_PATH,
  );

  const isInternalRoute =
    isAdminRoute ||
    isMfaSetupRoute ||
    isMfaVerifyRoute;

  const requiresAuthentication =
    isPublishRoute ||
    isProfileRoute ||
    isInternalRoute;

  /*
   * En las rutas públicas solamente renovamos la sesión.
   * Evitamos consultas adicionales de perfil, rol y MFA.
   */
  if (!requiresAuthentication) {
    await supabase.auth.getClaims();
    return response;
  }

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return redirectWithCookies(
      request,
      response,
      LOGIN_PATH,
      "sesion-requerida",
    );
  }

  if (isInternalRoute) {
    const { data: isStaff, error: roleError } =
      await supabase.rpc("is_staff");

    if (roleError) {
      console.error(
        "[auth/proxy] No se pudo comprobar el rol:",
        roleError.code,
      );

      return redirectWithCookies(
        request,
        response,
        LOGIN_PATH,
        "permisos",
      );
    }

    if (isStaff !== true) {
      return redirectWithCookies(
        request,
        response,
        PUBLISH_PATH,
      );
    }

    const {
      data: assuranceData,
      error: assuranceError,
    } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (assuranceError) {
      console.error(
        "[auth/proxy] No se pudo comprobar MFA:",
        assuranceError.message,
      );

      return redirectWithCookies(
        request,
        response,
        LOGIN_PATH,
        "mfa",
      );
    }

    const currentLevel = assuranceData.currentLevel;
    const nextLevel = assuranceData.nextLevel;

    if (isAdminRoute) {
      if (nextLevel !== "aal2") {
        return redirectWithCookies(
          request,
          response,
          MFA_SETUP_PATH,
        );
      }

      if (currentLevel !== "aal2") {
        return redirectWithCookies(
          request,
          response,
          MFA_VERIFY_PATH,
        );
      }

      return response;
    }

    if (isMfaSetupRoute) {
      if (
        currentLevel === "aal2" &&
        nextLevel === "aal2"
      ) {
        return redirectWithCookies(
          request,
          response,
          ADMIN_PATH,
        );
      }

      if (nextLevel === "aal2") {
        return redirectWithCookies(
          request,
          response,
          MFA_VERIFY_PATH,
        );
      }

      return response;
    }

    if (isMfaVerifyRoute) {
      if (nextLevel !== "aal2") {
        return redirectWithCookies(
          request,
          response,
          MFA_SETUP_PATH,
        );
      }

      if (currentLevel === "aal2") {
        return redirectWithCookies(
          request,
          response,
          ADMIN_PATH,
        );
      }

      return response;
    }
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", userId)
      .maybeSingle();

  if (profileError) {
    console.error(
      "[auth/proxy] No se pudo verificar el perfil:",
      profileError.code,
    );

    return redirectWithCookies(
      request,
      response,
      LOGIN_PATH,
      "perfil",
    );
  }

  const profileCompleted = Boolean(
    profile?.onboarding_completed_at,
  );

  if (isPublishRoute && !profileCompleted) {
    return redirectWithCookies(
      request,
      response,
      PROFILE_PATH,
    );
  }

  if (isProfileRoute && profileCompleted) {
    return redirectWithCookies(
      request,
      response,
      PUBLISH_PATH,
    );
  }

  return response;
}