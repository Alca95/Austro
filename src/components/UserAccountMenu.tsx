"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  CircleAlert,
  FileText,
  LoaderCircle,
  LogOut,
  UserRound,
} from "lucide-react";

export type HeaderUser = {
  displayName: string;
  email: string;
};

type UserAccountMenuProps = {
  user: HeaderUser;
};

function getInitial(displayName: string) {
  return displayName.trim().charAt(0).toLocaleUpperCase() || "U";
}

export default function UserAccountMenu({ user }: UserAccountMenuProps) {
  const router = useRouter();
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function handleSignOut() {
    if (isSigningOut) return;

    setError("");
    setIsSigningOut(true);

    try {
      const response = await fetch("/auth/cerrar-sesion", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("No fue posible cerrar la sesión.");
      }

      setIsOpen(false);
      router.replace("/");
      router.refresh();
    } catch {
      setError("No pudimos cerrar la sesión. Inténtalo nuevamente.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => {
          setError("");
          setIsOpen((current) => !current);
        }}
        className="group inline-flex min-h-11 max-w-[190px] items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-1.5 pr-3 text-left transition-all duration-200 hover:border-primary/30 hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:max-w-[230px]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
          {getInitial(user.displayName)}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">
            {user.displayName}
          </span>
        </span>

        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-text-secondary transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          strokeWidth={2}
        />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-50 mt-3 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-surface p-2 shadow-[0_20px_55px_rgba(11,31,51,0.16)]"
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserRound aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-foreground">
                {user.displayName}
              </span>
              {user.email && (
                <span className="mt-0.5 block truncate text-xs text-text-secondary">
                  {user.email}
                </span>
              )}
            </span>
          </div>

          <div className="border-t border-border/70 pt-2">
            <Link
              href="/mis-publicaciones"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <FileText
                aria-hidden="true"
                className="h-[18px] w-[18px]"
                strokeWidth={2}
              />
              Mis publicaciones
            </Link>
            <button
              type="button"
              role="menuitem"
              disabled={isSigningOut}
              onClick={handleSignOut}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-foreground transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSigningOut ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="h-[18px] w-[18px] animate-spin"
                />
              ) : (
                <LogOut
                  aria-hidden="true"
                  className="h-[18px] w-[18px]"
                  strokeWidth={2}
                />
              )}
              {isSigningOut ? "Cerrando sesión" : "Cerrar sesión"}
            </button>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-2 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700"
            >
              <CircleAlert
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
