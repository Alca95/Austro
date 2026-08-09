import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, MapPin, ShieldCheck } from "lucide-react";

import AuthForm from "@/components/AuthForm";

type LoginPageProps = {
  searchParams: Promise<{
    mode?: string;
    error?: string;
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;

  const initialMode =
    params.mode === "registro" ? "register" : "login";

  const initialError =
    params.error === "confirmacion"
      ? "El enlace de confirmación no es válido o ha expirado."
      : undefined;

  return (
    <main className="min-h-screen bg-background px-5 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_24px_70px_rgba(11,31,51,0.10)] lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden overflow-hidden bg-primary p-10 text-white lg:flex lg:flex-col">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-white/10" />

          <div className="relative">
            <Image
              src="/brand/austro-logo.svg"
              alt="Austro"
              width={174}
              height={48}
              className="brightness-0 invert"
              priority
            />

            <p className="mt-10 text-sm font-semibold text-white/75">
              Tecnología cercana y humana
            </p>

            <h2 className="mt-4 max-w-md text-4xl font-bold tracking-[-0.04em]">
              Todo Coronel Oviedo, más cerca de ti.
            </h2>

            <p className="mt-5 max-w-md leading-7 text-white/80">
              Publica y administra comercios, servicios y eventos desde una
              cuenta segura.
            </p>
          </div>

          <div className="relative mt-auto space-y-4">
            <div className="flex items-center gap-3 text-sm text-white/90">
              <BadgeCheck className="h-5 w-5" />
              Publicaciones verificables
            </div>

            <div className="flex items-center gap-3 text-sm text-white/90">
              <ShieldCheck className="h-5 w-5" />
              Información protegida
            </div>

            <div className="flex items-center gap-3 text-sm text-white/90">
              <MapPin className="h-5 w-5" />
              Exclusivo para Coronel Oviedo
            </div>
          </div>
        </aside>

        <section className="flex flex-col p-6 sm:p-10 lg:p-14">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>

            <Image
              src="/brand/austro-logo.svg"
              alt="Austro"
              width={142}
              height={40}
              className="h-auto w-[120px] lg:hidden"
              priority
            />
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 items-center py-10">
            <AuthForm
              initialMode={initialMode}
              initialError={initialError}
            />
          </div>
        </section>
      </div>
    </main>
  );
}