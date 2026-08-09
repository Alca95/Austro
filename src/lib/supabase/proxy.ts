import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_PATH = "/iniciar-sesion";
const PUBLISH_PATH = "/publicar";
const PROFILE_PATH = "/completar-perfil";

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

  sourceResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
    redirectResponse.cookies.set(name, value, options);
  });

  redirectResponse.headers.set("Cache-Control", "private, no-store");
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

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;
  const isPublishRoute = matchesPath(pathname, PUBLISH_PATH);
  const isProfileRoute = matchesPath(pathname, PROFILE_PATH);

  /*
   * En las rutas públicas solo renovamos la sesión.
   * No consultamos profiles innecesariamente.
   */
  if (!isPublishRoute && !isProfileRoute) {
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

  const { data: profile, error: profileError } = await supabase
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