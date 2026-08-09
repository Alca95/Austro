"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  IdCard,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Phone,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type ApiResponse = {
  success?: boolean;
  message?: string;
  redirectTo?: string;
};

const CI_PATTERN = /^\d{4,10}$/;
const PHONE_PATTERN = /^\+?\d{8,15}$/;

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

async function readApiResponse(response: Response): Promise<ApiResponse> {
  try {
    return (await response.json()) as ApiResponse;
  } catch {
    return {};
  }
}

export default function CompleteProfilePage() {
  const router = useRouter();

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [ci, setCi] = useState("");
  const [phone, setPhone] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function validateSession() {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (userError || !user) {
        router.replace("/iniciar-sesion?error=sesion");
        return;
      }

      const hasGoogleIdentity = user.identities?.some(
        (identity) => identity.provider === "google",
      );

      if (!hasGoogleIdentity) {
        router.replace("/publicar");
        return;
      }

      const metadataName = user.user_metadata?.full_name;

      setDisplayName(
        typeof metadataName === "string" ? metadataName.trim() : "",
      );
      setEmail(user.email ?? "");
      setIsCheckingSession(false);
    }

    void validateSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || isSigningOut) return;

    setError("");

    const normalizedCi = normalizeCi(ci);
    const normalizedPhone = normalizePhone(phone);

    if (!CI_PATTERN.test(normalizedCi)) {
      setError("Ingresa un número de CI válido, sin puntos.");
      return;
    }

    if (!PHONE_PATTERN.test(normalizedPhone)) {
      setError("Ingresa un número de teléfono o WhatsApp válido.");
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      setError("Debes aceptar los términos y la política de privacidad.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/complete-google-onboarding", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ci: normalizedCi,
          phone: normalizedPhone,
          termsAccepted,
          privacyAccepted,
        }),
      });

      const result = await readApiResponse(response);

      if (response.status === 401) {
        router.replace("/iniciar-sesion?error=sesion");
        router.refresh();
        return;
      }

      if (!response.ok) {
        setError(
          result.message ??
            "No pudimos completar el perfil. Revisa los datos e inténtalo nuevamente.",
        );
        return;
      }

      router.replace(result.redirectTo ?? "/publicar");
      router.refresh();
    } catch {
      setError(
        "No pudimos conectar con el servicio. Comprueba tu conexión e inténtalo nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignOut() {
    if (isSubmitting || isSigningOut) return;

    setError("");
    setIsSigningOut(true);

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      router.replace("/iniciar-sesion");
      router.refresh();
    }
  }

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5">
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 text-sm font-medium text-text-secondary"
        >
          <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
          Verificando tu cuenta
        </div>
      </main>
    );
  }

  const isBusy = isSubmitting || isSigningOut;

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl shadow-primary/10 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative overflow-hidden bg-primary px-7 py-10 text-white sm:px-10 lg:flex lg:min-h-[720px] lg:flex-col lg:justify-between lg:px-12 lg:py-12">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-black/10 blur-3xl"
          />

          <div className="relative">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <UserRoundCheck className="h-6 w-6" />
            </div>

            <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-white/70">
              Último paso
            </p>
            <h1 className="mt-3 max-w-md text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
              Completa tu perfil en Austro
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/80">
              Necesitamos estos datos para proteger tu cuenta y permitirte
              administrar tus publicaciones en Coronel Oviedo.
            </p>
          </div>

          <div className="relative mt-10 space-y-4 lg:mt-0">
            <Feature
              icon={ShieldCheck}
              text="Tu CI no se muestra públicamente."
            />
            <Feature
              icon={LockKeyhole}
              text="Tus datos se utilizan únicamente para verificar tu cuenta."
            />
            <Feature
              icon={CheckCircle2}
              text="Después podrás publicar comercios, servicios y eventos."
            />
          </div>
        </section>

        <section className="px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Cuenta de Google conectada
              </p>
              <h2 className="mt-2 truncate text-xl font-bold tracking-[-0.02em] text-foreground">
                {displayName || "Tu cuenta"}
              </h2>
              {email && (
                <p className="mt-1 truncate text-sm text-text-secondary">
                  {email}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isBusy}
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold text-text-secondary transition hover:border-primary/30 hover:bg-surface-soft hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSigningOut ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Cambiar cuenta</span>
            </button>
          </div>

          <div className="my-7 h-px bg-border" />

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="profile-ci"
                className="text-sm font-semibold text-foreground"
              >
                Número de CI
              </label>
              <div className="relative mt-2">
                <IdCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                <input
                  id="profile-ci"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={ci}
                  onChange={(event) => setCi(normalizeCi(event.target.value))}
                  placeholder="Ej.: 5234567"
                  minLength={4}
                  maxLength={10}
                  disabled={isBusy}
                  className={`${inputClass} pl-11`}
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-text-secondary">
                Escribe solamente números, sin puntos.
              </p>
            </div>

            <div>
              <label
                htmlFor="profile-phone"
                className="text-sm font-semibold text-foreground"
              >
                Teléfono o WhatsApp
              </label>
              <div className="relative mt-2">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                <input
                  id="profile-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value.slice(0, 22))
                  }
                  placeholder="Ej.: +595 981 123456"
                  maxLength={22}
                  disabled={isBusy}
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-surface-soft/50 p-4">
              <ConsentCheckbox
                id="profile-terms"
                checked={termsAccepted}
                onChange={setTermsAccepted}
                disabled={isBusy}
                label="Acepto los términos y condiciones de Austro."
              />
              <ConsentCheckbox
                id="profile-privacy"
                checked={privacyAccepted}
                onChange={setPrivacyAccepted}
                disabled={isBusy}
                label="Acepto la política de privacidad y el tratamiento de mis datos para crear y proteger mi cuenta."
              />
            </div>

            {error && <ErrorMessage message={error} />}

            <button
              type="submit"
              disabled={isBusy}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Guardando perfil
                </>
              ) : (
                <>
                  Completar y continuar
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-text-secondary">
            Esta información es privada y no aparecerá en tus publicaciones.
          </p>
        </section>
      </div>
    </main>
  );
}

type FeatureProps = {
  icon: typeof ShieldCheck;
  text: string;
};

function Feature({ icon: Icon, text }: FeatureProps) {
  return (
    <div className="flex items-start gap-3 text-sm leading-6 text-white/80">
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
        <Icon className="h-4 w-4 text-white" />
      </span>
      <p>{text}</p>
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
