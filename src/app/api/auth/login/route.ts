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

  const { error: signInError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (signInError) {
    return invalidCredentialsResponse();
  }

  return jsonResponse(
    {
      success: true,
      redirectTo: "/publicar",
    },
    200,
  );
}