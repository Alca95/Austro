import { NextResponse } from "next/server";

import { createCiIdentity } from "@/lib/auth/ci";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type LoginPayload = {
  ci?: unknown;
  password?: unknown;
};

const MAX_BODY_SIZE = 8_192;

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      Pragma: "no-cache",
    },
  });
}

function invalidCredentialsResponse() {
  return jsonResponse(
    {
      error: "INVALID_CREDENTIALS",
      message: "La CI o la contraseña no son correctas.",
    },
    401,
  );
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const contentLength = Number(
    request.headers.get("content-length") ?? "0",
  );

  if (!contentType.includes("application/json")) {
    return jsonResponse(
      { error: "INVALID_CONTENT_TYPE" },
      415,
    );
  }

  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_BODY_SIZE
  ) {
    return jsonResponse(
      { error: "REQUEST_TOO_LARGE" },
      413,
    );
  }

  let body: LoginPayload;

  try {
    body = (await request.json()) as LoginPayload;
  } catch {
    return jsonResponse(
      { error: "INVALID_REQUEST" },
      400,
    );
  }

  const ci =
    typeof body.ci === "string" ? body.ci : "";

  const password =
    typeof body.password === "string"
      ? body.password
      : "";

  if (!ci || !password || password.length > 128) {
    return invalidCredentialsResponse();
  }

  let ciIdentity;

  try {
    ciIdentity = createCiIdentity(ci);
  } catch {
    return invalidCredentialsResponse();
  }

  const { data: email, error: resolveError } =
    await supabaseAdmin.rpc("resolve_login_email_by_ci", {
      target_ci_hmac: ciIdentity.ciHmac,
    });

  if (
    resolveError ||
    typeof email !== "string" ||
    !email
  ) {
    return invalidCredentialsResponse();
  }

  const supabase = await createClient();

const { data: signInData, error: signInError } =
  await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError?.code === "email_not_confirmed") {
    const normalizedEmail = email.trim().toLowerCase();

    const { error: resendError } =
      await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
      });

    return jsonResponse(
      {
        success: false,
        error: "EMAIL_NOT_CONFIRMED",
        message: resendError
          ? "Tu correo todavía no está verificado. Continúa con la verificación para acceder."
          : "Tu correo todavía no está verificado. Te enviamos un nuevo código.",
        verificationRequired: true,
        verificationEmail: normalizedEmail,
        redirectTo: "/verificar-correo",
      },
      403,
    );
  }

  if (signInError) {
    return invalidCredentialsResponse();
  }

const authenticatedUserId = signInData.user?.id;

if (!authenticatedUserId) {
  await supabase.auth.signOut();
  return invalidCredentialsResponse();
}

const { data: roleRecord, error: roleError } =
  await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", authenticatedUserId)
    .maybeSingle();

if (roleError) {
  await supabase.auth.signOut();

  console.error(
    "[auth/login] No se pudo comprobar el rol:",
    roleError.code,
  );

  return jsonResponse(
    {
      error: "AUTHORIZATION_CHECK_FAILED",
      message:
        "No pudimos comprobar los permisos de la cuenta. Inténtalo nuevamente.",
    },
    500,
  );
}

  const staffRoles = new Set([
    "support",
    "moderator",
    "admin",
    "superadmin",
  ]);

  const isStaff =
    typeof roleRecord?.role === "string" &&
    staffRoles.has(roleRecord.role);

  if (!isStaff) {
    return jsonResponse(
      {
        success: true,
        redirectTo: "/publicar",
      },
      200,
    );
  }

  const {
    data: assuranceData,
    error: assuranceError,
  } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (assuranceError) {
    await supabase.auth.signOut();

    return jsonResponse(
      {
        error: "MFA_CHECK_FAILED",
        message:
          "No pudimos comprobar la seguridad de la cuenta. Inténtalo nuevamente.",
      },
      500,
    );
  }

  let redirectTo: string;

  if (
    assuranceData.currentLevel === "aal2" &&
    assuranceData.nextLevel === "aal2"
  ) {
    redirectTo = "/admin";
  } else if (assuranceData.nextLevel === "aal2") {
    redirectTo = "/verificar-mfa";
  } else {
    redirectTo = "/configurar-mfa";
  }

  return jsonResponse(
    {
      success: true,
      redirectTo,
    },
    200,
  );
}