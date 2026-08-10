import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_PATTERN = /^\d{8}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const token =
      typeof body.token === "string"
        ? body.token.replace(/\D/g, "")
        : "";

    if (!EMAIL_PATTERN.test(email) || !OTP_PATTERN.test(token)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Introduce un correo y un código válidos.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error || !data.user || !data.session) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "El código es incorrecto o ha expirado. Solicita uno nuevo e inténtalo nuevamente.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Correo verificado correctamente.",
      redirectTo: "/publicar",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message:
          "No fue posible verificar el correo en este momento. Inténtalo nuevamente.",
      },
      { status: 500 },
    );
  }
}