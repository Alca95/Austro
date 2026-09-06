"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  IdCard,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "register";

type AuthFormProps = {
  initialMode?: AuthMode;
  initialError?: string;
};

type ApiResponse = {
  success?: boolean;
  error?: string;
  message?: string;
  redirectTo?: string;
  verificationRequired?: boolean;
  verificationEmail?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CI_PATTERN = /^\d{4,10}$/;
const PHONE_PATTERN = /^\+?\d{8,15}$/;
const EMAIL_STORAGE_KEY = "austro.pendingVerificationEmail";

const inputClass =
  "min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground outline-none transition placeholder:text-text-secondary/70 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60";

function normalizeCi(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

function normalizePhone(value: string) {
  const trimmedValue = value.trim();
  const hasInternationalPrefix = trimmedValue.startsWith("+");
  const digits = trimmedValue.replace(/\D/g, "").slice(0, 15);

  return hasInternationalPrefix ? `+${digits}` : digits;
}

function isStrongPassword(password: string) {
  return (
    password.length >= 10 &&
    password.length <= 128 &&
    /\p{L}/u.test(password) &&
    /\d/.test(password)
  );
}

async function readApiResponse(response: Response): Promise<ApiResponse> {
  try {
    return (await response.json()) as ApiResponse;
  } catch {
    return {};
  }
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]">
      <path
        fill="#4285F4"
        d="M21.6 12.227c0-.709-.064-1.391-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.995 3.018v2.51h3.232c1.891-1.741 2.981-4.305 2.981-7.35Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.964-.895 6.619-2.423l-3.232-2.509c-.895.6-2.041.955-3.387.955-2.605 0-4.81-1.76-5.6-4.123H3.06v2.591A9.997 9.997 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.9A6.01 6.01 0 0 1 6.086 12c0-.659.114-1.3.314-1.9V7.51H3.06A9.997 9.997 0 0 0 2 12c0 1.614.386 3.141 1.06 4.49L6.4 13.9Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C16.959 2.99 14.696 2 12 2a9.997 9.997 0 0 0-8.94 5.51L6.4 10.1C7.19 7.736 9.395 5.977 12 5.977Z"
      />
    </svg>
  );
}

export default function AuthForm({
  initialMode = "login",
  initialError,
}: AuthFormProps) {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isRecovering, setIsRecovering] = useState(false);
  const [fullName, setFullName] = useState("");
  const [ci, setCi] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(initialError ?? "");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    function resetSubmittingState() {
      setIsSubmitting(false);
    }

    window.addEventListener("pageshow", resetSubmittingState);

    return () => {
      window.removeEventListener("pageshow", resetSubmittingState);
    };
  }, []);

  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setIsRecovering(false);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    clearFeedback();
  }

  function openRecovery() {
    setIsRecovering(true);
    setPassword("");
    clearFeedback();
  }

  async function handleGoogleSignIn() {
    if (isSubmitting) return;

    clearFeedback();
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const redirectTo = new URL("/auth/callback", window.location.origin);

      redirectTo.searchParams.set("next", "/completar-perfil");

      const { error: oauthError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectTo.toString(),
            queryParams: {
              prompt: "select_account",
            },
          },
        });

      if (oauthError) {
        setError("No fue posible continuar con Google. Inténtalo nuevamente.");
        setIsSubmitting(false);
      }
    } catch {
      setError("No fue posible conectar con Google en este momento.");
      setIsSubmitting(false);
    }
  }

  async function handleRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    clearFeedback();

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError("Ingresa el correo asociado a tu cuenta.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const redirectTo = new URL("/auth/callback", window.location.origin);

      redirectTo.searchParams.set("next", "/actualizar-contrasena");

      await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: redirectTo.toString(),
      });

      setSuccess(
        "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
      );
    } catch {
      setSuccess(
        "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    clearFeedback();

    const normalizedCi = normalizeCi(ci);

    if (!CI_PATTERN.test(normalizedCi)) {
      setError("Ingresa un número de CI válido.");
      return;
    }

    if (!password || password.length > 128) {
      setError(
        mode === "login"
          ? "Completa la CI y la contraseña."
          : "Ingresa una contraseña válida.",
      );
      return;
    }

    if (mode === "register") {
      const normalizedName = fullName.trim().replace(/\s+/g, " ");
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPhone = normalizePhone(phone);

      if (normalizedName.length < 3 || normalizedName.length > 120) {
        setError("Ingresa tu nombre completo.");
        return;
      }

      if (
        normalizedEmail.length > 254 ||
        !EMAIL_PATTERN.test(normalizedEmail)
      ) {
        setError("Ingresa un correo electrónico válido.");
        return;
      }

      if (!PHONE_PATTERN.test(normalizedPhone)) {
        setError("Ingresa un número de teléfono válido.");
        return;
      }

      if (!isStrongPassword(password)) {
        setError(
          "La contraseña debe tener al menos 10 caracteres, incluyendo letras y números.",
        );
        return;
      }

      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }

      if (!termsAccepted || !privacyAccepted) {
        setError("Debes aceptar los términos y la política de privacidad.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";

      const payload =
        mode === "login"
          ? {
              ci: normalizedCi,
              password,
            }
          : {
              fullName: fullName.trim().replace(/\s+/g, " "),
              ci: normalizedCi,
              email: email.trim().toLowerCase(),
              phone: normalizePhone(phone),
              password,
              termsAccepted,
              privacyAccepted,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await readApiResponse(response);

      if (
        !response.ok &&
        result.error === "EMAIL_NOT_CONFIRMED" &&
        result.verificationRequired === true &&
        typeof result.verificationEmail === "string"
      ) {
        const verificationEmail = result.verificationEmail
          .trim()
          .toLowerCase();

        if (EMAIL_PATTERN.test(verificationEmail)) {
          sessionStorage.setItem(
            EMAIL_STORAGE_KEY,
            verificationEmail,
          );

          router.replace("/verificar-correo");
          return;
        }
      }

      if (!response.ok) {
        setError(
          result.message ??
            "No pudimos completar la solicitud. Inténtalo nuevamente.",
        );
        return;
      }

      if (mode === "login") {
        window.location.assign(result.redirectTo ?? "/publicar");
        return;
      }
      const pendingEmail = email.trim().toLowerCase();

      sessionStorage.setItem(EMAIL_STORAGE_KEY, pendingEmail);

      router.replace("/verificar-correo");
    } catch {
      setError(
        "No pudimos conectar con el servicio. Comprueba tu conexión e inténtalo nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isRecovering) {
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={() => {
            setIsRecovering(false);
            clearFeedback();
          }}
          className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-text-secondary transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a iniciar sesión
        </button>

        <div className="mt-6">
          <h1 className="text-3xl font-bold tracking-[-0.04em] text-foreground">
            Recupera tu contraseña
          </h1>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            Ingresa el correo privado asociado a tu cuenta y te enviaremos un
            enlace seguro.
          </p>
        </div>

        <form onSubmit={handleRecovery} className="mt-7 space-y-5">
          <div>
            <label
              htmlFor="auth-recovery-email"
              className="text-sm font-semibold text-foreground"
            >
              Correo electrónico
            </label>
            <div className="relative mt-2">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                id="auth-recovery-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nombre@correo.com"
                disabled={isSubmitting}
                className={`${inputClass} pl-11`}
              />
            </div>
          </div>

          {error && <ErrorMessage message={error} />}
          {success && <SuccessMessage message={success} />}

          <SubmitButton
            isSubmitting={isSubmitting}
            idleLabel="Enviar enlace seguro"
          />
        </form>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 rounded-xl bg-surface-soft p-1">
        <button
          type="button"
          onClick={() => changeMode("login")}
          disabled={isSubmitting}
          className={`min-h-11 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            mode === "login"
              ? "bg-surface text-primary shadow-sm"
              : "text-text-secondary hover:text-foreground"
          }`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => changeMode("register")}
          disabled={isSubmitting}
          className={`min-h-11 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            mode === "register"
              ? "bg-surface text-primary shadow-sm"
              : "text-text-secondary hover:text-foreground"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      <div className="mt-7">
        <h1 className="text-3xl font-bold tracking-[-0.04em] text-foreground">
          {mode === "login" ? "Bienvenido a Austro" : "Crea tu cuenta"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          {mode === "login"
            ? "Accede con tu CI para administrar tus publicaciones."
            : "Regístrate para publicar comercios, servicios o eventos en Coronel Oviedo."}
        </p>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isSubmitting}
        className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface px-5 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <LoaderCircle className="h-[18px] w-[18px] animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continuar con Google
      </button>

      <div className="my-6 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
          o
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === "register" && (
          <div>
            <label
              htmlFor="auth-full-name"
              className="text-sm font-semibold text-foreground"
            >
              Nombre completo
            </label>
            <div className="relative mt-2">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                id="auth-full-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Ej.: Juan Pérez"
                maxLength={120}
                disabled={isSubmitting}
                className={`${inputClass} pl-11`}
              />
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="auth-ci"
            className="text-sm font-semibold text-foreground"
          >
            Número de CI
          </label>
          <div className="relative mt-2">
            <IdCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              id="auth-ci"
              type="text"
              inputMode="numeric"
              autoComplete="username"
              value={ci}
              onChange={(event) => setCi(normalizeCi(event.target.value))}
              placeholder="Ej.: 5234567"
              maxLength={10}
              disabled={isSubmitting}
              className={`${inputClass} pl-11`}
            />
          </div>
          {mode === "register" && (
            <p className="mt-2 text-xs leading-5 text-text-secondary">
              Escribe solo números, sin puntos.
            </p>
          )}
        </div>

        {mode === "register" && (
          <>
            <div>
              <label
                htmlFor="auth-email"
                className="text-sm font-semibold text-foreground"
              >
                Correo electrónico
              </label>
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                <input
                  id="auth-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nombre@correo.com"
                  maxLength={254}
                  disabled={isSubmitting}
                  className={`${inputClass} pl-11`}
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-text-secondary">
                Será privado y se usará para confirmar y recuperar tu cuenta.
              </p>
            </div>

            <div>
              <label
                htmlFor="auth-phone"
                className="text-sm font-semibold text-foreground"
              >
                Teléfono o WhatsApp
              </label>
              <div className="relative mt-2">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                <input
                  id="auth-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value.slice(0, 22))
                  }
                  placeholder="Ej.: +595 981 123456"
                  disabled={isSubmitting}
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>
          </>
        )}

        <div>
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="auth-password"
              className="text-sm font-semibold text-foreground"
            >
              Contraseña
            </label>
            {mode === "login" && (
              <button
                type="button"
                onClick={openRecovery}
                disabled={isSubmitting}
                className="text-xs font-semibold text-primary transition hover:text-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>
          <div className="relative mt-2">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={
                mode === "login" ? "Tu contraseña" : "Mínimo 10 caracteres"
              }
              maxLength={128}
              disabled={isSubmitting}
              className={`${inputClass} pl-11 pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              disabled={isSubmitting}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              aria-pressed={showPassword}
              className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-text-secondary transition hover:bg-surface-soft hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {mode === "register" && (
            <p className="mt-2 text-xs leading-5 text-text-secondary">
              Usa al menos 10 caracteres e incluye letras y números.
            </p>
          )}
        </div>

        {mode === "register" && (
          <>
            <div>
              <label
                htmlFor="auth-confirm-password"
                className="text-sm font-semibold text-foreground"
              >
                Confirmar contraseña
              </label>
              <div className="relative mt-2">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                <input
                  id="auth-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repite la contraseña"
                  maxLength={128}
                  disabled={isSubmitting}
                  className={`${inputClass} pl-11 pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  disabled={isSubmitting}
                  aria-label={
                    showConfirmPassword
                      ? "Ocultar confirmación de contraseña"
                      : "Mostrar confirmación de contraseña"
                  }
                  aria-pressed={showConfirmPassword}
                  className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-text-secondary transition hover:bg-surface-soft hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-surface-soft/50 p-4">
              <ConsentCheckbox
                id="auth-terms"
                checked={termsAccepted}
                onChange={setTermsAccepted}
                disabled={isSubmitting}
                label="Acepto los términos y condiciones de Austro."
              />
              <ConsentCheckbox
                id="auth-privacy"
                checked={privacyAccepted}
                onChange={setPrivacyAccepted}
                disabled={isSubmitting}
                label="Acepto la política de privacidad y el tratamiento de mis datos para crear y proteger mi cuenta."
              />
            </div>
          </>
        )}

        {error && <ErrorMessage message={error} />}
        {success && <SuccessMessage message={success} />}

        <SubmitButton
          isSubmitting={isSubmitting}
          idleLabel={mode === "login" ? "Ingresar" : "Crear cuenta"}
        />
      </form>

      <p className="mt-6 text-center text-xs leading-5 text-text-secondary">
        Tus datos privados se utilizan para verificar y proteger tu cuenta. No
        se muestran en tus publicaciones.
      </p>
    </div>
  );
}

type ConsentCheckboxProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled: boolean;
  label: string;
};

function ConsentCheckbox({
  id,
  checked,
  onChange,
  disabled,
  label,
}: ConsentCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-text-secondary"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary disabled:cursor-not-allowed disabled:opacity-60"
      />
      <span>{label}</span>
    </label>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

function SuccessMessage({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
    >
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

type SubmitButtonProps = {
  isSubmitting: boolean;
  idleLabel: string;
};

function SubmitButton({ isSubmitting, idleLabel }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSubmitting ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Procesando
        </>
      ) : (
        <>
          {idleLabel}
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}
