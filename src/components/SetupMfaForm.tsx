"use client";

import Image from "next/image";
import {
  Check,
  Copy,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { createClient } from "@/lib/supabase/client";

type MfaEnrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

type Feedback = {
  type: "error" | "info" | "success";
  message: string;
};

function normalizeTotpCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

export default function SetupMfaForm() {
  const supabase = useMemo(() => createClient(), []);

  const [enrollment, setEnrollment] =
    useState<MfaEnrollment | null>(null);
  const [code, setCode] = useState("");
  const [feedback, setFeedback] =
    useState<Feedback | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  const isBusy = isPreparing || isVerifying;

  async function prepareEnrollment() {
    if (isBusy) {
      return;
    }

    setFeedback(null);
    setIsPreparing(true);
    setCode("");
    setSecretCopied(false);

    try {
      const {
        data: factorsData,
        error: factorsError,
      } = await supabase.auth.mfa.listFactors();

      if (factorsError) {
        throw factorsError;
      }

      const verifiedFactor = factorsData.totp.find(
        (factor) => factor.status === "verified",
      );

      if (verifiedFactor) {
        setEnrollment(null);
        setFeedback({
          type: "info",
          message:
            "Esta cuenta ya tiene configurada la autenticación en dos pasos. Debes validar el código de tu aplicación para continuar.",
        });
        return;
      }

      const unverifiedFactors = factorsData.all.filter(
        (factor) =>
          factor.factor_type === "totp" &&
          factor.status === "unverified",
      );

      for (const factor of unverifiedFactors) {
        const { error: unenrollError } =
          await supabase.auth.mfa.unenroll({
            factorId: factor.id,
          });

        if (unenrollError) {
          throw unenrollError;
        }
      }

      const {
        data: enrollmentData,
        error: enrollmentError,
      } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "AUSTRO",
      });

      if (enrollmentError) {
        throw enrollmentError;
      }

      setEnrollment({
        factorId: enrollmentData.id,
        qrCode: enrollmentData.totp.qr_code.trimEnd(),
        secret: enrollmentData.totp.secret.trim(),
      });
    } catch (error) {
      console.error(
        "[mfa/setup] No se pudo iniciar la inscripción:",
        error instanceof Error ? error.message : "unknown_error",
      );

      setEnrollment(null);
      setFeedback({
        type: "error",
        message:
          "No pudimos preparar la autenticación en dos pasos. Actualiza la página e inténtalo nuevamente.",
      });
    } finally {
      setIsPreparing(false);
    }
  }

  function handleCodeChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setCode(normalizeTotpCode(event.target.value));

    if (feedback?.type === "error") {
      setFeedback(null);
    }
  }

  async function copySecret() {
    if (!enrollment?.secret) {
      return;
    }

    try {
      await navigator.clipboard.writeText(enrollment.secret);
      setSecretCopied(true);

      window.setTimeout(() => {
        setSecretCopied(false);
      }, 2_000);
    } catch {
      setFeedback({
        type: "error",
        message:
          "No se pudo copiar la clave. Puedes seleccionarla y copiarla manualmente.",
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!enrollment || isBusy) {
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
          factorId: enrollment.factorId,
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
        throw assuranceError ?? new Error("AAL2_NOT_REACHED");
      }

      setFeedback({
        type: "success",
        message:
          "La autenticación en dos pasos quedó activada correctamente.",
      });

      window.setTimeout(() => {
        window.location.assign("/admin");
      }, 800);
    } catch (error) {
      console.error(
        "[mfa/setup] No se pudo verificar el factor:",
        error instanceof Error ? error.message : "unknown_error",
      );

      setFeedback({
        type: "error",
        message:
          "No pudimos activar la autenticación en dos pasos. Inténtalo nuevamente.",
      });
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <section className="mfa-card">
      <div className="mfa-card__icon" aria-hidden="true">
        <ShieldCheck size={30} strokeWidth={1.8} />
      </div>

      <header className="mfa-card__header">
        <span className="mfa-card__eyebrow">
          Seguridad de la cuenta
        </span>

        <h1>Configura la verificación en dos pasos</h1>

        <p>
          Protege el acceso interno de AUSTRO mediante códigos
          temporales generados desde tu teléfono.
        </p>
      </header>

      <div className="mfa-steps">
        <div className="mfa-step">
          <span className="mfa-step__number">1</span>
          <Smartphone size={20} aria-hidden="true" />
          <div>
            <strong>Instala una aplicación</strong>
            <span>
              Google Authenticator, Microsoft Authenticator o Authy.
            </span>
          </div>
        </div>

        <div className="mfa-step">
          <span className="mfa-step__number">2</span>
          <KeyRound size={20} aria-hidden="true" />
          <div>
            <strong>Escanea el código QR</strong>
            <span>
              La aplicación generará un código nuevo cada 30 segundos.
            </span>
          </div>
        </div>
      </div>

      {!enrollment && (
        <button
          type="button"
          className="mfa-primary-button"
          onClick={prepareEnrollment}
          disabled={isBusy}
        >
          {isPreparing ? (
            <>
              <LoaderCircle
                className="mfa-spinner"
                size={19}
                aria-hidden="true"
              />
              Preparando configuración
            </>
          ) : (
            <>
              <ShieldCheck size={19} aria-hidden="true" />
              Comenzar configuración
            </>
          )}
        </button>
      )}

      {enrollment && (
        <form
          className="mfa-enrollment"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="mfa-qr">
            <Image
              src={enrollment.qrCode}
              alt="Código QR para configurar la autenticación en dos pasos"
              width={220}
              height={220}
              unoptimized
            />
          </div>

          <div className="mfa-secret">
            <span>Clave de configuración manual</span>

            <div className="mfa-secret__value">
              <code>{enrollment.secret}</code>

              <button
                type="button"
                onClick={copySecret}
                aria-label="Copiar clave de configuración"
                title="Copiar clave"
              >
                {secretCopied ? (
                  <Check size={18} aria-hidden="true" />
                ) : (
                  <Copy size={18} aria-hidden="true" />
                )}
              </button>
            </div>

            <small>
              Utiliza esta clave únicamente si no puedes escanear el
              código QR. No la compartas.
            </small>
          </div>

          <div className="mfa-code-field">
            <label htmlFor="mfa-setup-code">
              Código de verificación
            </label>

            <input
              id="mfa-setup-code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              aria-describedby="mfa-code-help"
              autoFocus
            />

            <small id="mfa-code-help">
              Ingresa los seis dígitos mostrados en tu aplicación.
            </small>
          </div>

          <button
            type="submit"
            className="mfa-primary-button"
            disabled={isBusy || code.length !== 6}
          >
            {isVerifying ? (
              <>
                <LoaderCircle
                  className="mfa-spinner"
                  size={19}
                  aria-hidden="true"
                />
                Verificando código
              </>
            ) : (
              <>
                <ShieldCheck size={19} aria-hidden="true" />
                Activar protección
              </>
            )}
          </button>

          <button
            type="button"
            className="mfa-secondary-button"
            onClick={prepareEnrollment}
            disabled={isBusy}
          >
            Generar un código QR nuevo
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