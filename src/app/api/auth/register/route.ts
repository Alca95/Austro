import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createCiIdentity } from "@/lib/auth/ci";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RegisterPayload = {
  fullName?: unknown;
  ci?: unknown;
  email?: unknown;
  phone?: unknown;
  password?: unknown;
  termsAccepted?: unknown;
  privacyAccepted?: unknown;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?\d{8,15}$/;
const MAX_BODY_SIZE = 16_384;

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isStrongPassword(password: string): boolean {
  return (
    password.length >= 10 &&
    password.length <= 128 &&
    /\p{L}/u.test(password) &&
    /\d/.test(password)
  );
}

async function rollbackUser(userId: string) {
  const { error } =
    await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    console.error("No se pudo revertir el usuario incompleto.");
  }
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

  let body: RegisterPayload;

  try {
    body = (await request.json()) as RegisterPayload;
  } catch {
    return jsonResponse(
      { error: "INVALID_REQUEST" },
      400,
    );
  }

  const fullName = readString(body.fullName)
    .replace(/\s+/g, " ");

  const email = readString(body.email).toLowerCase();

  const phone = readString(body.phone)
    .replace(/[^\d+]/g, "");

  const password = readString(body.password);

  if (fullName.length < 3 || fullName.length > 120) {
    return jsonResponse(
      {
        error: "INVALID_FULL_NAME",
        message: "Ingresa tu nombre completo.",
      },
      400,
    );
  }

  if (
    email.length > 254 ||
    !EMAIL_PATTERN.test(email)
  ) {
    return jsonResponse(
      {
        error: "INVALID_EMAIL",
        message: "Ingresa un correo electrónico válido.",
      },
      400,
    );
  }

  if (!PHONE_PATTERN.test(phone)) {
    return jsonResponse(
      {
        error: "INVALID_PHONE",
        message: "Ingresa un número de teléfono válido.",
      },
      400,
    );
  }

  if (!isStrongPassword(password)) {
    return jsonResponse(
      {
        error: "WEAK_PASSWORD",
        message:
          "La contraseña debe tener entre 10 y 128 caracteres, incluyendo letras y números.",
      },
      400,
    );
  }

  if (
    body.termsAccepted !== true ||
    body.privacyAccepted !== true
  ) {
    return jsonResponse(
      {
        error: "CONSENT_REQUIRED",
        message:
          "Debes aceptar los términos y la política de privacidad.",
      },
      400,
    );
  }

  let ciIdentity;

  try {
    ciIdentity = createCiIdentity(readString(body.ci));
  } catch {
    return jsonResponse(
      {
        error: "INVALID_CI",
        message: "Ingresa un número de CI válido.",
      },
      400,
    );
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!supabaseUrl || !publishableKey || !appUrl) {
    console.error("Configuración incompleta del registro.");

    return jsonResponse(
      {
        error: "SERVICE_UNAVAILABLE",
        message:
          "El registro no está disponible temporalmente.",
      },
      503,
    );
  }

  let confirmationUrl: string;

  try {
    confirmationUrl = new URL(
      "/auth/callback",
      appUrl,
    ).toString();
  } catch {
    console.error("NEXT_PUBLIC_APP_URL no es válida.");

    return jsonResponse(
      {
        error: "SERVICE_UNAVAILABLE",
        message:
          "El registro no está disponible temporalmente.",
      },
      503,
    );
  }

  const registrationClient = createSupabaseClient(
    supabaseUrl,
    publishableKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );

  const { data, error: signUpError } =
    await registrationClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: confirmationUrl,
        data: {
          full_name: fullName,
        },
      },
    });

  if (signUpError || !data.user) {
    return jsonResponse(
      {
        error: "REGISTRATION_FAILED",
        message:
          "No fue posible crear la cuenta con los datos ingresados.",
      },
      400,
    );
  }

  const identities = data.user.identities;

  if (
    Array.isArray(identities) &&
    identities.length === 0
  ) {
    return jsonResponse(
      {
        error: "REGISTRATION_FAILED",
        message:
          "No fue posible crear la cuenta con los datos ingresados.",
      },
      409,
    );
  }

  const userId = data.user.id;
  const acceptedAt = new Date().toISOString();

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      full_name: fullName,
      phone,
      terms_accepted_at: acceptedAt,
      privacy_accepted_at: acceptedAt,
      last_profile_reviewed_at: acceptedAt,
    })
    .eq("id", userId);

  if (profileError) {
    await rollbackUser(userId);

    return jsonResponse(
      {
        error: "REGISTRATION_FAILED",
        message:
          "No fue posible completar la creación de la cuenta.",
      },
      500,
    );
  }

  const { error: identityError } =
    await supabaseAdmin.rpc("register_ci_identity", {
      target_user_id: userId,
      target_ci_hmac: ciIdentity.ciHmac,
      target_ci_last4: ciIdentity.ciLast4,
      target_registration_method: "email",
    });

  if (identityError) {
    await rollbackUser(userId);

    return jsonResponse(
      {
        error: "REGISTRATION_FAILED",
        message:
          "No fue posible crear la cuenta con los datos ingresados.",
      },
      409,
    );
  }

  return jsonResponse(
    {
      success: true,
      message:
        "Cuenta creada. Revisa tu correo para confirmar el registro.",
    },
    201,
  );
}