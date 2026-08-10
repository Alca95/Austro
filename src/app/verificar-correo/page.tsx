import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import VerifyEmailForm from "@/components/VerifyEmailForm";

export const metadata: Metadata = {
  title: "Verificar correo | Austro",
  description:
    "Confirma tu correo electrónico para completar el registro en Austro.",
};

export default function VerifyEmailPage() {
  return (
    <main className="verify-email-page">
      <div className="verify-email-background" aria-hidden="true">
        <span className="verify-email-orb verify-email-orb--primary" />
        <span className="verify-email-orb verify-email-orb--secondary" />
      </div>

      <div className="verify-email-container">
        <header className="verify-email-header">
          <Link
            href="/"
            className="verify-email-brand"
            aria-label="Ir al inicio de Austro"
          >
            <span className="verify-email-brand-mark" aria-hidden="true">
              A
            </span>

            <span className="verify-email-brand-name">Austro</span>
          </Link>

          <Link href="/login" className="verify-email-back">
            <ArrowLeft aria-hidden="true" />
            Volver al acceso
          </Link>
        </header>

        <section
          className="verify-email-content"
          aria-labelledby="verification-page-title"
        >
          <div className="verify-email-introduction">
            <span className="verify-email-eyebrow">Último paso</span>

            <h2 id="verification-page-title">
              Tu cuenta está casi lista
            </h2>

            <p>
              La verificación protege tu identidad y evita que otra persona
              registre una cuenta utilizando tu correo electrónico.
            </p>

            <div className="verify-email-progress" aria-label="Progreso: paso 2 de 2">
              <span className="verify-email-progress-step verify-email-progress-step--complete">
                1
              </span>

              <span className="verify-email-progress-line" />

              <span className="verify-email-progress-step verify-email-progress-step--active">
                2
              </span>
            </div>

            <div className="verify-email-progress-labels" aria-hidden="true">
              <span>Crear cuenta</span>
              <span>Verificar correo</span>
            </div>
          </div>

          <VerifyEmailForm />
        </section>

        <footer className="verify-email-footer">
          <p>
            Austro · Comercios, servicios y eventos de Coronel Oviedo
          </p>
        </footer>
      </div>
    </main>
  );
}