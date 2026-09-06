import type { LucideIcon } from "lucide-react";
import {
  ChartNoAxesCombined,
  Check,
  FileText,
  Flag,
  KeyRound,
  Layers3,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";

interface SecurityItem {
  label: string;
  description: string;
  icon: LucideIcon;
}

interface PlannedArea {
  label: string;
  description: string;
  icon: LucideIcon;
}

const securityItems: SecurityItem[] = [
  {
    label: "Identidad verificada",
    description: "Inicio de sesión administrativo mediante Google.",
    icon: KeyRound,
  },
  {
    label: "Segundo factor activo",
    description: "Validación TOTP obligatoria para el personal interno.",
    icon: ShieldCheck,
  },
  {
    label: "Acceso por privilegios",
    description: "Rutas y herramientas protegidas según el rol asignado.",
    icon: Layers3,
  },
];

const plannedAreas: PlannedArea[] = [
  {
    label: "Publicaciones",
    description: "Moderación, estados y control del contenido publicado.",
    icon: FileText,
  },
  {
    label: "Usuarios",
    description: "Consulta y administración de las cuentas de la plataforma.",
    icon: Users,
  },
  {
    label: "Reportes",
    description: "Seguimiento de incidencias y contenido reportado.",
    icon: Flag,
  },
  {
    label: "Categorías",
    description: "Organización de comercios, servicios y eventos.",
    icon: Tags,
  },
];

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6">
      <section
        aria-labelledby="admin-overview-title"
        className="relative overflow-hidden rounded-[28px] border border-border/75 bg-surface px-6 py-7 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.35)] sm:px-8 sm:py-9"
      >
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-24 size-72 rounded-full bg-primary/[0.045] blur-3xl"
        />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="size-2 rounded-full bg-primary" />
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                Centro de control
              </p>
            </div>

            <h1
              id="admin-overview-title"
              className="max-w-2xl text-3xl font-extrabold tracking-[-0.035em] text-foreground sm:text-[2.5rem] sm:leading-[1.1]"
            >
              Una visión clara de la operación de AUSTRO.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
              Este espacio centralizará la moderación, las cuentas, los reportes
              y la configuración de la plataforma a medida que cada módulo se
              conecte con información real.
            </p>
          </div>

          <div className="flex min-h-11 shrink-0 items-center gap-3 self-start rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-emerald-800 xl:self-auto">
            <span className="flex size-7 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check size={15} strokeWidth={2.5} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold">Acceso protegido</p>
              <p className="mt-0.5 text-[11px] text-emerald-700">
                Identidad, rol y MFA verificados
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-12">
        <section
          aria-labelledby="security-title"
          className="rounded-[26px] border border-border/75 bg-surface p-6 shadow-[0_16px_45px_-40px_rgba(15,23,42,0.3)] sm:p-7 xl:col-span-8"
        >
          <div className="flex flex-col gap-3 border-b border-border/65 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-secondary">
                Seguridad administrativa
              </p>
              <h2
                id="security-title"
                className="mt-2 text-xl font-extrabold tracking-[-0.025em] text-foreground"
              >
                Controles de acceso operativos
              </h2>
            </div>

            <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
              3 controles activos
            </span>
          </div>

          <div className="mt-2 divide-y divide-border/60">
            {securityItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="flex items-start gap-4 py-5 first:pt-4 last:pb-1"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/[0.055] text-primary">
                    <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h3 className="text-sm font-bold text-foreground">
                        {item.label}
                      </h3>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Activo
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-text-secondary">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside
          aria-labelledby="access-level-title"
          className="relative overflow-hidden rounded-[26px] bg-slate-950 p-6 text-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.75)] sm:p-7 xl:col-span-4"
        >
          <div
            aria-hidden="true"
            className="absolute -right-14 -top-14 size-48 rounded-full bg-primary/25 blur-3xl"
          />

          <div className="relative flex h-full min-h-[300px] flex-col">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-blue-300">
              <ShieldCheck size={22} strokeWidth={1.8} aria-hidden="true" />
            </div>

            <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Nivel de acceso
            </p>
            <h2
              id="access-level-title"
              className="mt-2 text-2xl font-extrabold tracking-[-0.03em]"
            >
              Acceso administrativo
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              La plataforma habilita únicamente las herramientas autorizadas
              para el rol asociado a esta cuenta.
            </p>

            <div className="mt-auto border-t border-white/10 pt-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-medium text-slate-400">
                  Sesión administrativa
                </span>
                <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  Verificada
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <section
          aria-labelledby="planned-areas-title"
          className="rounded-[26px] border border-border/75 bg-surface p-6 shadow-[0_16px_45px_-40px_rgba(15,23,42,0.3)] sm:p-7 xl:col-span-8"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-secondary">
                Desarrollo progresivo
              </p>
              <h2
                id="planned-areas-title"
                className="mt-2 text-xl font-extrabold tracking-[-0.025em] text-foreground"
              >
                Próximas áreas de control
              </h2>
            </div>
            <p className="text-xs text-text-secondary">
              Se habilitarán con datos reales
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {plannedAreas.map((area) => {
              const Icon = area.icon;

              return (
                <article
                  key={area.label}
                  className="group rounded-2xl border border-border/70 bg-surface-soft/55 p-4 transition-colors duration-200 hover:border-primary/20 hover:bg-primary/[0.025]"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-surface text-text-secondary transition-colors duration-200 group-hover:border-primary/15 group-hover:text-primary">
                      <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">
                          {area.label}
                        </h3>
                        <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-text-secondary">
                          Planificado
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-5 text-text-secondary">
                        {area.description}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="metrics-title"
          className="rounded-[26px] border border-border/75 bg-surface p-6 shadow-[0_16px_45px_-40px_rgba(15,23,42,0.3)] sm:p-7 xl:col-span-4"
        >
          <div className="flex size-11 items-center justify-center rounded-2xl border border-primary/10 bg-primary/[0.055] text-primary">
            <ChartNoAxesCombined
              size={20}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>

          <h2
            id="metrics-title"
            className="mt-5 text-xl font-extrabold tracking-[-0.025em] text-foreground"
          >
            Indicadores operativos
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Este bloque mostrará publicaciones, usuarios, reportes y actividad
            cuando las consultas estén conectadas a la base de datos.
          </p>

          <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface-soft/60 px-4 py-5">
            <p className="text-xs font-bold text-foreground">
              Sin datos simulados
            </p>
            <p className="mt-1.5 text-xs leading-5 text-text-secondary">
              Los indicadores aparecerán únicamente cuando representen el
              estado real de AUSTRO.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
