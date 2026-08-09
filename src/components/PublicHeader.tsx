import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

import MobileNavigation from "./MobileNavigation";
import UserAccountMenu, { type HeaderUser } from "./UserAccountMenu";

type PublicHeaderProps = {
  activePage?: "explorar" | "publicar";
};

function getMetadataName(metadata: Record<string, unknown>) {
  const candidates = [metadata.full_name, metadata.name];

  return candidates.find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
}

async function getHeaderUser(): Promise<HeaderUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const profileName =
      typeof profile?.full_name === "string" ? profile.full_name.trim() : "";
    const metadataName = getMetadataName(user.user_metadata)?.trim();
    const email = user.email ?? "";
    const emailAlias = email.includes("@") ? email.split("@")[0] : "";

    return {
      displayName: profileName || metadataName || emailAlias || "Mi cuenta",
      email,
    };
  } catch {
    return null;
  }
}

export default async function PublicHeader({ activePage }: PublicHeaderProps) {
  const user = await getHeaderUser();
  const navigationClass = (page: PublicHeaderProps["activePage"]) =>
    `text-sm font-semibold transition-colors hover:text-primary ${
      activePage === page ? "text-primary" : "text-foreground"
    }`;

  return (
    <header className="border-b border-border/70 bg-surface">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          aria-label="Ir a la página principal de Austro"
          className="shrink-0"
        >
          <Image
            src="/brand/austro-logo.svg"
            alt="Austro"
            width={174}
            height={48}
            priority
            className="h-auto w-[142px] sm:w-[160px]"
          />
        </Link>

        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-8 md:flex"
        >
          <Link href="/explorar" className={navigationClass("explorar")}>
            Explorar
          </Link>

          <Link href="/publicar" className={navigationClass("publicar")}>
            Publicar
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-foreground sm:flex">
            <MapPin
              aria-hidden="true"
              className="h-[18px] w-[18px] text-primary"
              strokeWidth={2}
            />
            Coronel Oviedo
          </span>

          {user ? (
            <UserAccountMenu user={user} />
          ) : (
            <Link
              href="/iniciar-sesion"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Iniciar sesión
            </Link>
          )}

          <MobileNavigation />
        </div>
      </div>
    </header>
  );
}
