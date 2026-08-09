"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MapPin, Menu, X } from "lucide-react";
import Link from "next/link";

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const navigationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        navigationRef.current &&
        !navigationRef.current.contains(event.target as Node)
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

  return (
    <div ref={navigationRef} className="relative md:hidden">
      <button
        type="button"
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:border-primary/30 hover:bg-surface-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {isOpen ? (
          <X aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
        ) : (
          <Menu aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
        )}
      </button>

      {isOpen && (
        <div
          id={menuId}
          className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-border bg-surface p-2 shadow-[0_20px_55px_rgba(11,31,51,0.16)]"
        >
          <nav aria-label="Navegación móvil">
            <Link
              href="/explorar"
              onClick={() => setIsOpen(false)}
              className="flex min-h-12 items-center rounded-xl px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-soft hover:text-primary"
            >
              Explorar
            </Link>

            <Link
              href="/publicar"
              onClick={() => setIsOpen(false)}
              className="flex min-h-12 items-center rounded-xl px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-soft hover:text-primary"
            >
              Publicar
            </Link>
          </nav>

          <div className="mt-2 flex items-center gap-2 border-t border-border/70 px-4 pb-2 pt-3 text-sm text-text-secondary">
            <MapPin
              aria-hidden="true"
              className="h-[18px] w-[18px] shrink-0 text-primary"
              strokeWidth={2}
            />
            Coronel Oviedo
          </div>
        </div>
      )}
    </div>
  );
}
