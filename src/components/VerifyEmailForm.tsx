"use client";

import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { CheckCircle2, Loader2, Mail, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";


const OTP_LENGTH = 8;
const RESEND_COOLDOWN_SECONDS = 60;
const EMAIL_STORAGE_KEY = "austro.pendingVerificationEmail";

type ApiResponse = {
  ok?: boolean;
  message?: string;
  redirectTo?: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getStoredVerificationEmail(): string {
  try {
    const storedEmail = window.sessionStorage.getItem(EMAIL_STORAGE_KEY);

    return storedEmail ? normalizeEmail(storedEmail) : "";
  } catch {
    return "";
  }
}

function getServerVerificationEmail(): null {
  return null;
}

function subscribeToStoredVerificationEmail() {
  return () => {};
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return email;
  }

  const visibleCharacters = Math.min(2, localPart.length);
  const visiblePart = localPart.slice(0, visibleCharacters);
  const hiddenPart = "•".repeat(Math.max(3, localPart.length - visibleCharacters));

  return `${visiblePart}${hiddenPart}@${domain}`;
}

export default function VerifyEmailForm() {
  const router = useRouter();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const storedEmail = useSyncExternalStore(
    subscribeToStoredVerificationEmail,
    getStoredVerificationEmail,
    getServerVerificationEmail,
    );

    const [emailInput, setEmailInput] = useState<string | null>(null);
    const email = emailInput ?? storedEmail ?? "";
  const [digits, setDigits] = useState<string[]>(
    Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");


  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldown((currentValue) => Math.max(0, currentValue - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  function updateDigit(index: number, value: string) {
    const numericValue = value.replace(/\D/g, "");

    if (!numericValue) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      setDigits(nextDigits);
      return;
    }

    if (numericValue.length > 1) {
      const pastedDigits = numericValue.slice(0, OTP_LENGTH).split("");
      const nextDigits = Array.from(
        { length: OTP_LENGTH },
        (_, digitIndex) => pastedDigits[digitIndex] ?? "",
      );

      setDigits(nextDigits);

      const nextEmptyIndex = nextDigits.findIndex((digit) => !digit);
      const focusIndex =
        nextEmptyIndex === -1 ? OTP_LENGTH - 1 : nextEmptyIndex;

      inputRefs.current[focusIndex]?.focus();
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = numericValue;
    setDigits(nextDigits);

    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleDigitChange(
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    updateDigit(index, event.target.value);
  }

  function handleKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    setEmailInput(normalizeEmail(event.target.value));
    setMessage("");
    setMessageType("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = digits.join("");
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || token.length !== OTP_LENGTH) {
      setMessage("Introduce tu correo y el código completo de ocho dígitos.");
      setMessageType("error");
      return;
    }

    setIsVerifying(true);
    setMessage("");
    setMessageType("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          token,
        }),
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.ok) {
        setMessage(
          result.message ??
            "No fue posible verificar el código. Inténtalo nuevamente.",
        );
        setMessageType("error");
        return;
      }

      sessionStorage.removeItem(EMAIL_STORAGE_KEY);
      setMessage(result.message ?? "Correo verificado correctamente.");
      setMessageType("success");

      router.replace(result.redirectTo ?? "/publicar");
      router.refresh();
    } catch {
      setMessage(
        "No fue posible conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.",
      );
      setMessageType("error");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || cooldown > 0 || isResending) {
      return;
    }

    setIsResending(true);
    setMessage("");
    setMessageType("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.ok) {
        setMessage(
          result.message ??
            "No fue posible reenviar el código. Inténtalo nuevamente.",
        );
        setMessageType("error");
        return;
      }

      sessionStorage.setItem(EMAIL_STORAGE_KEY, normalizedEmail);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setDigits(Array.from({ length: OTP_LENGTH }, () => ""));
      setMessage(
        result.message ?? "Te enviamos un nuevo código de verificación.",
      );
      setMessageType("success");
      inputRefs.current[0]?.focus();
    } catch {
      setMessage(
        "No fue posible conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.",
      );
      setMessageType("error");
    } finally {
      setIsResending(false);
    }
  }

  if (storedEmail === null) {
    return (
      <div className="verify-email-loading" aria-label="Cargando verificación">
        <Loader2 aria-hidden="true" className="verify-email-spinner" />
      </div>
    );
  }

  return (
    <div className="verify-email-card">
      <div className="verify-email-icon" aria-hidden="true">
        <Mail />
      </div>

      <div className="verify-email-heading">
        <span>Seguridad de la cuenta</span>
        <h1>Verifica tu correo</h1>
        <p>
          Introduce el código de ocho dígitos que enviamos a tu correo
          electrónico.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="verify-email-field">
          <label htmlFor="verification-email">Correo electrónico</label>
          <input
            id="verification-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="nombre@correo.com"
            maxLength={254}
            required
          />

          {email && (
            <small>
              Código enviado a <strong>{maskEmail(email)}</strong>
            </small>
          )}
        </div>

        <fieldset className="verify-email-code-group">
          <legend>Código de verificación</legend>

          <div className="verify-email-code-inputs">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                pattern="[0-9]*"
                maxLength={index === 0 ? OTP_LENGTH : 1}
                value={digit}
                onChange={(event) => handleDigitChange(index, event)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                aria-label={`Dígito ${index + 1} del código`}
                disabled={isVerifying}
              />
            ))}
          </div>
        </fieldset>

        {message && (
          <div
            className={`verify-email-message verify-email-message--${messageType}`}
            role={messageType === "error" ? "alert" : "status"}
          >
            {messageType === "success" && (
              <CheckCircle2 aria-hidden="true" />
            )}
            <span>{message}</span>
          </div>
        )}

        <button
          type="submit"
          className="verify-email-submit"
          disabled={
            isVerifying ||
            !email ||
            digits.some((digit) => digit.length !== 1)
          }
        >
          {isVerifying ? (
            <>
              <Loader2 aria-hidden="true" className="verify-email-spinner" />
              Verificando…
            </>
          ) : (
            "Verificar correo"
          )}
        </button>
      </form>

      <div className="verify-email-resend">
        <p>¿No recibiste el código?</p>

        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || isResending || !email}
        >
          {isResending ? (
            <>
              <Loader2 aria-hidden="true" className="verify-email-spinner" />
              Reenviando…
            </>
          ) : cooldown > 0 ? (
            `Reenviar en ${cooldown} s`
          ) : (
            <>
              <RefreshCw aria-hidden="true" />
              Reenviar código
            </>
          )}
        </button>
      </div>
    </div>
  );
}