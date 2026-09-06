"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  FileText,
  Flag,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  ScrollText,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  X,
} from "lucide-react";

type AdminRole = "support" | "moderator" | "admin" | "superadmin";

type NavigationSection = "operation" | "system";

interface AdminShellProps {
  children: ReactNode;
  role: AdminRole;
  email: string | null;
}

interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  section: NavigationSection;
  available: boolean;
  superadminOnly?: boolean;
}

const navigation: NavigationItem[] = [
  {
    label: "Resumen",
    href: "/admin",
    icon: LayoutDashboard,
    section: "operation",
    available: true,
  },
  {
    label: "Publicaciones",
    href: "/admin/publicaciones",
    icon: FileText,
    section: "operation",
    available: false,
  },
  {
    label: "Usuarios",
    href: "/admin/usuarios",
    icon: Users,
    section: "operation",
    available: false,
  },
  {
    label: "Reportes",
    href: "/admin/reportes",
    icon: Flag,
    section: "operation",
    available: false,
  },
  {
    label: "Categorías",
    href: "/admin/categorias",
    icon: Tags,
    section: "operation",
    available: false,
  },
  {
    label: "Administradores",
    href: "/admin/administradores",
    icon: ShieldCheck,
    section: "system",
    available: false,
    superadminOnly: true,
  },
  {
    label: "Auditoría",
    href: "/admin/auditoria",
    icon: ScrollText,
    section: "system",
    available: false,
    superadminOnly: true,
  },
  {
    label: "Configuración",
    href: "/admin/configuracion",
    icon: Settings,
    section: "system",
    available: false,
    superadminOnly: true,
  },
];

const sectionLabels: Record<NavigationSection, string> = {
  operation: "Operación",
  system: "Sistema",
};

const roleLabels: Record<AdminRole, string> = {
  support: "Soporte",
  moderator: "Moderador",
  admin: "Administrador",
  superadmin: "Superadministrador",
};

function getInitial(email: string | null): string {
  const initial = email?.trim().charAt(0);
  return initial ? initial.toUpperCase() : "A";
}

export default function AdminShell({ children, role, email }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const visibleNavigation = navigation.filter(
    (item) => !item.superadminOnly || role === "superadmin",
  );

  const currentItem =
    visibleNavigation.find((item) => {
      if (item.href === "/admin") {
        return pathname === item.href;
      }

      return pathname.startsWith(item.href);
    }) ?? visibleNavigation[0];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileMenuOpen]);

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === href;
    }

    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      <div className="flex h-[76px] shrink-0 items-center border-b border-border/70 px-6">
        <Link
          href="/admin"
          aria-label="Ir al resumen administrativo de Austro"
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
        >
          <Image
            src="/brand/austro-logo.svg"
            alt="Austro"
            width={150}
            height={42}
            priority
            className="h-auto w-[142px]"
          />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/5 text-primary">
            <ShieldCheck size={19} strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">
              Centro de control
            </p>
            <p className="mt-0.5 text-xs text-text-secondary">
              Gestión de la plataforma
            </p>
          </div>
        </div>

        <nav aria-label="Navegación administrativa">
          {(["operation", "system"] as NavigationSection[]).map(
            (section, sectionIndex) => {
              const items = visibleNavigation.filter(
                (item) => item.section === section,
              );

              if (items.length === 0) {
                return null;
              }

              return (
                <div key={section} className={sectionIndex === 0 ? "" : "mt-7"}>
                  <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary/80">
                    {sectionLabels[section]}
                  </p>

                  <div className="space-y-1">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);

                      if (!item.available) {
                        return (
                          <div
                            key={item.href}
                            title={`${item.label}: disponible próximamente`}
                            aria-disabled="true"
                            className="group flex min-h-11 cursor-not-allowed items-center gap-3 rounded-xl px-3 text-sm font-medium text-text-secondary/75"
                          >
                            <Icon
                              size={18}
                              strokeWidth={1.75}
                              className="shrink-0"
                            />
                            <span className="min-w-0 flex-1 truncate">
                              {item.label}
                            </span>
                            <LockKeyhole
                              size={13}
                              strokeWidth={1.8}
                              aria-hidden="true"
                              className="shrink-0 opacity-55"
                            />
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={[
                            "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors duration-200",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                            active
                              ? "bg-primary/[0.08] text-primary"
                              : "text-foreground/80 hover:bg-surface-soft hover:text-foreground",
                          ].join(" ")}
                        >
                          {active && (
                            <span
                              aria-hidden="true"
                              className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary"
                            />
                          )}

                          <Icon
                            size={18}
                            strokeWidth={active ? 2 : 1.75}
                            className="shrink-0"
                          />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            },
          )}
        </nav>
      </div>

      <div className="shrink-0 border-t border-border/70 p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-surface-soft/70 p-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-sm font-bold text-surface">
            {getInitial(email)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">
              {roleLabels[role]}
            </p>
            <p className="mt-0.5 truncate text-xs text-text-secondary">
              {email ?? "Cuenta administrativa"}
            </p>
          </div>

          {role === "superadmin" && (
            <ShieldCheck
              size={17}
              strokeWidth={1.8}
              aria-label="Cuenta con control total"
              className="shrink-0 text-primary"
            />
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-border/70 bg-surface lg:flex">
        {sidebarContent}
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar navegación"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navegación administrativa"
            className="relative flex h-full w-[88%] max-w-[292px] flex-col bg-surface shadow-2xl"
          >
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-3 top-4 z-10 flex size-11 items-center justify-center rounded-xl text-text-secondary transition-colors duration-200 hover:bg-surface-soft hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <X size={20} />
            </button>

            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-surface/90 backdrop-blur-xl">
          <div className="flex h-[76px] items-center justify-between gap-4 px-5 md:px-8 xl:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Abrir navegación"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(true)}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/80 text-foreground transition-colors duration-200 hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-text-secondary">
                  Administración
                </p>
                <h1 className="mt-1 truncate text-base font-bold tracking-[-0.02em] text-foreground md:text-lg">
                  {currentItem?.label ?? "Resumen"}
                </h1>
              </div>
            </div>

            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border/80 bg-surface px-3.5 text-sm font-semibold text-foreground transition-colors duration-200 hover:border-primary/25 hover:bg-primary/[0.04] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:px-4"
            >
              <span className="hidden sm:inline">Ver plataforma</span>
              <ArrowUpRight size={17} strokeWidth={1.9} />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] p-5 md:p-8 xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
