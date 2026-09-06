import Link from "next/link";
import { redirect } from "next/navigation";

import VerifyMfaForm from "@/components/VerifyMfaForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Verificar identidad | AUSTRO",
  description:
    "Verificación en dos pasos para acceder al panel interno de AUSTRO.",
};

export default async function VerificarMfaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/iniciar-sesion");
  }

  const { data: isStaff, error: roleError } =
    await supabase.rpc("is_staff");

  if (roleError || isStaff !== true) {
    redirect("/publicar");
  }

  const {
    data: assuranceData,
    error: assuranceError,
  } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (assuranceError) {
    redirect("/iniciar-sesion");
  }

  if (
    assuranceData.currentLevel === "aal2" &&
    assuranceData.nextLevel === "aal2"
  ) {
    redirect("/admin");
  }

  if (assuranceData.nextLevel !== "aal2") {
    redirect("/configurar-mfa");
  }

  return (
    <main className="mfa-page">
      <div className="mfa-page__background" aria-hidden="true">
        <span className="mfa-page__orb mfa-page__orb--one" />
        <span className="mfa-page__orb mfa-page__orb--two" />
      </div>

      <div className="mfa-page__container">
        <Link
          href="/"
          className="mfa-brand"
          aria-label="Ir al inicio de AUSTRO"
        >
          <span className="mfa-brand__mark">A</span>

          <span>
            <strong>AUSTRO</strong>
            <small>Seguridad interna</small>
          </span>
        </Link>

        <VerifyMfaForm />

        <p className="mfa-page__footer">
          El código temporal protege tu cuenta incluso si alguien
          obtiene tu contraseña.
        </p>
      </div>
    </main>
  );
}