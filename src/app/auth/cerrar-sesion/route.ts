import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

function noStoreJson(body: Record<string, unknown>, status: number) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Pragma", "no-cache");

  return response;
}

export async function POST(request: NextRequest) {
  const requestOrigin = request.headers.get("origin");

  if (requestOrigin && requestOrigin !== request.nextUrl.origin) {
    return noStoreJson({ message: "Solicitud no permitida." }, 403);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error) {
    return noStoreJson({ message: "No fue posible cerrar la sesión." }, 500);
  }

  return noStoreJson({ success: true }, 200);
}
