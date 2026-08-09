"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  FileText,
  Flag,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  X,
  ScrollText,
} from "lucide-react";

type AdminRole =
  | "support"
  | "moderator"
  | "admin"
  | "superadmin";

interface AdminShellProps {
  children: ReactNode;
  role: AdminRole;
  email: string | null;
}

interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  available: boolean;
  superadminOnly?: boolean;
}

const navigation: NavigationItem[] = [
  {
    label: "Resumen",
    href: "/admin",
    icon: LayoutDashboard,
    available: true,
  },
  {
    label: "Publicaciones",
    href: "/admin/publicaciones",
    icon: FileText,
    available: false,
  },
  {
    label: "Usuarios",
    href: "/admin/usuarios",
    icon: Users,
    available: false,
  },
  {
    label: "Reportes",
    href: "/admin/reportes",
    icon: Flag,
    available: false,
  },
  {
    label: "Categorías",
    href: "/admin/categorias",
    icon: Tags,
    available: false,
  },
  {
    label: "Administradores",
    href: "/admin/administradores",
    icon: ShieldCheck,
    available: false,
    superadminOnly: true,
  },
  {
    label: "Auditoría",
    href: "/admin/auditoria",
    icon: ScrollText,
    available: false,
    superadminOnly: true,
  },
  {
    label: "Configuración",
    href: "/admin/configuracion",
    icon: Settings,
    available: false,
    superadminOnly: true,
  },
];

const roleLabels: Record<AdminRole, string> = {
  support: "Soporte",
  moderator: "Moderador",
  admin: "Administrador",
  superadmin: "Superadministrador",
};

export default function AdminShell({
  children,
  role,
  email,
}: AdminShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const visibleNavigation = navigation.filter(
    (item) => !item.superadminOnly || role === "superadmin",
  );

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === href;
    }

    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      <div className="flex h-20 items-center border-b border-border px-6">
        <Link
          href="/admin"
          aria-label="Panel administrativo de Austro"
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

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-text-secondary">
          Administración
        </p>

        <nav
          className="space-y-1"
          aria-label="Navegación administrativa"
        >
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            if (!item.available) {
              return (
                <div
                  key={item.href}
                  title="Este módulo se habilitará próximamente"
                  className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-text-secondary opacity-60"
                >
                  <Icon size={19} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "text-foreground hover:bg-surface-soft",
                ].join(" ")}
              >
                <Icon size={19} strokeWidth={1.9} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {role === "superadmin" && (
          <div className="mx-3 mt-7 rounded-xl border border-primary/15 bg-primary/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <ShieldCheck size={18} />
              <span className="text-xs font-bold uppercase tracking-wide">
                Control del sistema
              </span>
            </div>

            <p className="text-xs leading-5 text-text-secondary">
              Acceso propietario protegido mediante permisos
              exclusivos.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-border p-4">
        <div className="rounded-xl bg-surface-soft p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {email?.charAt(0).toUpperCase() ?? "A"}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {roleLabels[role]}
              </p>
              <p className="truncate text-xs text-text-secondary">
                {email ?? "Cuenta administrativa"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-border bg-surface lg:flex">
        {sidebarContent}
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-foreground/35 backdrop-blur-sm"
          />

          <aside className="relative flex h-full w-[86%] max-w-72 flex-col bg-surface shadow-2xl">
            <button
              type="button"
              aria-label="Cerrar navegación"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-4 top-5 z-10 rounded-lg p-2 text-text-secondary hover:bg-surface-soft"
            >
              <X size={20} />
            </button>

            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-surface/95 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Abrir navegación"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-border p-2.5 text-foreground lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
                Centro de control
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">
                Panel administrativo
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Notificaciones administrativas"
            className="relative rounded-xl border border-border bg-surface p-2.5 text-text-secondary transition-colors hover:bg-surface-soft hover:text-primary"
          >
            <Bell size={20} />

            <span className="absolute right-2 top-2 size-2 rounded-full bg-error ring-2 ring-surface" />
          </button>
        </header>

        <main className="p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}