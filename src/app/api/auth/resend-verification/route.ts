import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Introduce un correo electrónico válido.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "No pudimos reenviar el código todavía. Espera un minuto e inténtalo nuevamente.",
        },
        { status: 429 },
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        "Si el correo corresponde a un registro pendiente, recibirás un nuevo código.",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message:
          "No fue posible reenviar el código en este momento. Inténtalo nuevamente.",
      },
      { status: 500 },
    );
  }
}