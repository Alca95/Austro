import Image from "next/image";
import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="border-t border-border/70 bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-5 py-9 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/" aria-label="Ir al inicio">
            <Image
              src="/brand/austro-logo.svg"
              alt="Austro"
              width={150}
              height={42}
              className="h-auto w-[132px]"
            />
          </Link>

          <p className="mt-3 text-sm text-text-secondary">
            Todo lo que necesitas en Coronel Oviedo.
          </p>
        </div>

        <nav
          aria-label="Navegación del pie de página"
          className="flex flex-wrap items-center gap-x-6 gap-y-3"
        >
          <Link
            href="/"
            className="text-sm font-medium text-text-secondary transition-colors hover:text-primary"
          >
            Inicio
          </Link>
          <Link
            href="/explorar"
            className="text-sm font-medium text-text-secondary transition-colors hover:text-primary"
          >
            Explorar
          </Link>
          <Link
            href="/publicar"
            className="text-sm font-medium text-text-secondary transition-colors hover:text-primary"
          >
            Publicar
          </Link>
        </nav>

        <p className="text-sm text-text-secondary">© 2026 Austro</p>
      </div>
    </footer>
  );
}
