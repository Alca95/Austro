"use client";

import {
  KeyRound,
  LoaderCircle,
  LogOut,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { createClient } from "@/lib/supabase/client";

type Feedback = {
  type: "error" | "info" | "success";
  message: string;
};

function normalizeTotpCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

export default function VerifyMfaForm() {
  const supabase = useMemo(() => createClient(), []);

  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(
    null,
  );
  const [isLoadingFactor, setIsLoadingFactor] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isBusy =
    isLoadingFactor || isVerifying || isSigningOut;

  useEffect(() => {
    let isActive = true;

    async function loadVerifiedFactor() {
      try {
        const { data, error } =
          await supabase.auth.mfa.listFactors();

        if (error) {
          throw error;
        }

        const verifiedFactor = data.totp.find(
          (factor) => factor.status === "verified",
        );

        if (!isActive) {
          return;
        }

        if (!verifiedFactor) {
          setFeedback({
            type: "info",
            message:
              "Esta cuenta todavía no tiene configurada la autenticación en dos pasos.",
          });
          return;
        }

        setFactorId(verifiedFactor.id);
      } catch (error) {
        console.error(
          "[mfa/verify] No se pudo obtener el factor:",
          error instanceof Error
            ? error.message
            : "unknown_error",
        );

        if (isActive) {
          setFeedback({
            type: "error",
            message:
              "No pudimos preparar la verificación. Actualiza la página e inténtalo nuevamente.",
          });
        }
      } finally {
        if (isActive) {
          setIsLoadingFactor(false);
        }
      }
    }

    void loadVerifiedFactor();

    return () => {
      isActive = false;
    };
  }, [supabase]);

  function handleCodeChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setCode(normalizeTotpCode(event.target.value));

    if (feedback?.type === "error") {
      setFeedback(null);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!factorId || isBusy) {
      return;
    }

    if (code.length !== 6) {
      setFeedback({
        type: "error",
        message:
          "Ingresa el código de seis dígitos generado por tu aplicación.",
      });
      return;
    }

    setFeedback(null);
    setIsVerifying(true);

    try {
      const { error: verificationError } =
        await supabase.auth.mfa.challengeAndVerify({
          factorId,
          code,
        });

      if (verificationError) {
        setCode("");
        setFeedback({
          type: "error",
          message:
            "El código no es válido o ya venció. Espera un código nuevo e inténtalo otra vez.",
        });
        return;
      }

      const {
        data: assuranceData,
        error: assuranceError,
      } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (
        assuranceError ||
        assuranceData.currentLevel !== "aal2"
      ) {
        throw (
          assuranceError ?? new Error("AAL2_NOT_REACHED")
        );
      }

      setFeedback({
        type: "success",
        message: "Identidad verificada. Accediendo al panel.",
      });

      window.setTimeout(() => {
        window.location.assign("/admin");
      }, 600);
    } catch (error) {
      console.error(
        "[mfa/verify] No se pudo completar la verificación:",
        error instanceof Error
          ? error.message
          : "unknown_error",
      );

      setFeedback({
        type: "error",
        message:
          "No pudimos completar la verificación. Inténtalo nuevamente.",
      });
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleSignOut() {
    if (isBusy) {
      return;
    }

    setIsSigningOut(true);

    try {
      await supabase.auth.signOut();
    } finally {
      window.location.assign("/iniciar-sesion");
    }
  }

  return (
    <section className="mfa-card">
      <div className="mfa-card__icon" aria-hidden="true">
        <ShieldCheck size={30} strokeWidth={1.8} />
      </div>

      <header className="mfa-card__header">
        <span className="mfa-card__eyebrow">
          Acceso protegido
        </span>

        <h1>Verifica tu identidad</h1>

        <p>
          Ingresa el código temporal generado por la aplicación
          autenticadora vinculada a tu cuenta.
        </p>
      </header>

      <div className="mfa-steps">
        <div className="mfa-step">
          <span className="mfa-step__number">1</span>
          <Smartphone size={20} aria-hidden="true" />

          <div>
            <strong>Abre tu aplicación</strong>
            <span>
              Utiliza la aplicación con la que configuraste AUSTRO.
            </span>
          </div>
        </div>

        <div className="mfa-step">
          <span className="mfa-step__number">2</span>
          <KeyRound size={20} aria-hidden="true" />

          <div>
            <strong>Obtén el código</strong>
            <span>
              El código cambia automáticamente cada 30 segundos.
            </span>
          </div>
        </div>
      </div>

      {isLoadingFactor ? (
        <div className="mfa-feedback mfa-feedback--info" role="status">
          Preparando verificación…
        </div>
      ) : (
        <form
          className="mfa-enrollment"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="mfa-code-field">
            <label htmlFor="mfa-verification-code">
              Código de verificación
            </label>

            <input
              id="mfa-verification-code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              aria-describedby="mfa-verification-help"
              disabled={!factorId || isBusy}
              autoFocus
            />

            <small id="mfa-verification-help">
              Ingresa los seis dígitos mostrados en tu aplicación.
            </small>
          </div>

          <button
            type="submit"
            className="mfa-primary-button"
            disabled={
              !factorId || isBusy || code.length !== 6
            }
          >
            {isVerifying ? (
              <>
                <LoaderCircle
                  className="mfa-spinner"
                  size={19}
                  aria-hidden="true"
                />
                Verificando identidad
              </>
            ) : (
              <>
                <ShieldCheck size={19} aria-hidden="true" />
                Verificar y continuar
              </>
            )}
          </button>

          {!factorId && (
            <button
              type="button"
              className="mfa-secondary-button"
              onClick={() => {
                window.location.assign("/configurar-mfa");
              }}
            >
              Configurar autenticación
            </button>
          )}

          <button
            type="button"
            className="mfa-secondary-button"
            onClick={handleSignOut}
            disabled={isBusy}
          >
            {isSigningOut ? (
              <>
                <LoaderCircle
                  className="mfa-spinner"
                  size={18}
                  aria-hidden="true"
                />
                Cerrando sesión
              </>
            ) : (
              <>
                <LogOut size={18} aria-hidden="true" />
                Ingresar con otra cuenta
              </>
            )}
          </button>
        </form>
      )}

      {feedback && (
        <div
          className={`mfa-feedback mfa-feedback--${feedback.type}`}
          role={feedback.type === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </div>
      )}
    </section>
  );
}