import { NextResponse } from "next/server";

import { createCiIdentity } from "@/lib/auth/ci";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type OnboardingPayload = {
  ci?: unknown;
  phone?: unknown;
  termsAccepted?: unknown;
  privacyAccepted?: unknown;
};

const PHONE_PATTERN = /^\+?\d{8,15}$/;
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

function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return jsonResponse(
      { error: "INVALID_ORIGIN" },
      403,
    );
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return jsonResponse(
      { error: "INVALID_CONTENT_TYPE" },
      415,
    );
  }

  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return jsonResponse(
      { error: "INVALID_REQUEST" },
      400,
    );
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_SIZE) {
    return jsonResponse(
      { error: "REQUEST_TOO_LARGE" },
      413,
    );
  }

  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(rawBody) as unknown;
  } catch {
    return jsonResponse(
      { error: "INVALID_REQUEST" },
      400,
    );
  }

  if (
    typeof parsedBody !== "object" ||
    parsedBody === null ||
    Array.isArray(parsedBody)
  ) {
    return jsonResponse(
      { error: "INVALID_REQUEST" },
      400,
    );
  }

  const body = parsedBody as OnboardingPayload;

  const phone = readString(body.phone).replace(/[^\d+]/g, "");

  if (!PHONE_PATTERN.test(phone)) {
    return jsonResponse(
      {
        error: "INVALID_PHONE",
        message: "Ingresa un número de teléfono válido.",
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
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_CI_HMAC_CONFIGURATION"
    ) {
      console.error("Configuración HMAC de CI inválida.");

      return jsonResponse(
        {
          error: "SERVICE_UNAVAILABLE",
          message:
            "No fue posible completar el perfil temporalmente.",
        },
        503,
      );
    }

    return jsonResponse(
      {
        error: "INVALID_CI",
        message: "Ingresa un número de CI válido.",
      },
      400,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonResponse(
      {
        error: "UNAUTHORIZED",
        message: "Tu sesión venció. Inicia sesión nuevamente.",
      },
      401,
    );
  }

  const { error: onboardingError } = await supabaseAdmin.rpc(
    "complete_google_onboarding",
    {
      target_user_id: user.id,
      target_ci_hmac: ciIdentity.ciHmac,
      target_ci_last4: ciIdentity.ciLast4,
      target_phone: phone,
      target_terms_accepted: true,
      target_privacy_accepted: true,
    },
  );

  if (onboardingError) {
    console.error(
      "No se pudo completar el perfil de Google.",
      onboardingError.code,
    );

    return jsonResponse(
      {
        error: "ONBOARDING_FAILED",
        message:
          "No fue posible completar el perfil con los datos ingresados.",
      },
      409,
    );
  }

  return jsonResponse(
    {
      success: true,
      redirectTo: "/publicar",
    },
    200,
  );
}
