"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  GraduationCap,
  HeartPulse,
  House,
  PanelLeftClose,
  PanelLeftOpen,
  PartyPopper,
  Scissors,
  Utensils,
} from "lucide-react";

const categories = [
  {
    label: "Gastronomía",
    icon: Utensils,
    iconClass: "bg-orange-50 text-orange-600",
  },
  {
    label: "Salud",
    icon: HeartPulse,
    iconClass: "bg-rose-50 text-rose-600",
  },
  {
    label: "Belleza",
    icon: Scissors,
    iconClass: "bg-violet-50 text-violet-600",
  },
  {
    label: "Hogar",
    icon: House,
    iconClass: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Educación",
    icon: GraduationCap,
    iconClass: "bg-blue-50 text-blue-600",
  },
  {
    label: "Entretenimiento",
    icon: PartyPopper,
    iconClass: "bg-amber-50 text-amber-600",
  },
];

export default function CategorySidebar() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside
      className={`w-full shrink-0 overflow-hidden rounded-none border border-border/80 bg-surface shadow-[0_12px_35px_rgba(11,31,51,0.06)] transition-[width] duration-300 lg:w-auto ${
        isOpen ? "lg:w-60" : "lg:w-[68px]"
      }`}
    >
      <div
        className={`flex min-h-16 items-center border-b border-border/60 ${
          isOpen
            ? "justify-between gap-3 px-4"
            : "justify-between px-4 lg:justify-center lg:px-3"
        }`}
      >
        <div className={`min-w-0 ${isOpen ? "" : "lg:hidden"}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
            Explorar
          </p>

          <h2 className="mt-0.5 text-sm font-bold text-foreground">
            Por categorías
          </h2>
        </div>

        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="category-navigation"
          aria-label={
            isOpen
              ? "Ocultar panel de categorías"
              : "Mostrar panel de categorías"
          }
          onClick={() => setIsOpen((current) => !current)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-surface-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="hidden lg:block">
            {isOpen ? (
              <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={1.9} />
            ) : (
              <PanelLeftOpen className="h-[18px] w-[18px]" strokeWidth={1.9} />
            )}
          </span>

          <span className="lg:hidden">
            {isOpen ? (
              <ChevronUp className="h-[18px] w-[18px]" strokeWidth={2} />
            ) : (
              <ChevronDown className="h-[18px] w-[18px]" strokeWidth={2} />
            )}
          </span>
        </button>
      </div>

      {isOpen && (
        <nav
          id="category-navigation"
          aria-label="Categorías disponibles"
          className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-1"
        >
          {categories.map(({ label, icon: Icon, iconClass }) => (
            <button
              key={label}
              type="button"
              className="group flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
              >
                <Icon
                  aria-hidden="true"
                  className="h-[18px] w-[18px]"
                  strokeWidth={1.9}
                />
              </span>

              <span className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                {label}
              </span>
            </button>
          ))}
        </nav>
      )}
    </aside>
  );
}