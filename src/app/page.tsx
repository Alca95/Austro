import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Grid2X2,
  Search,
  Store,
} from "lucide-react";
import HomeListings from "../components/HomeListings";
import PublicFooter from "../components/PublicFooter";
import PublicHeader from "../components/PublicHeader";
import { getPublicDirectory } from "../lib/listings/public-directory";

export default async function Home() {
  let directory;
  let directoryUnavailable = false;

  try {
    directory = await getPublicDirectory({ page: "1" });
  } catch {
    directoryUnavailable = true;
  }

  const recentListings = directory?.listings.slice(0, 3) ?? [];
  const categories = directory?.categories ?? [];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main>
        <section
          id="explorar"
          className="mx-auto w-full max-w-7xl px-5 pb-10 pt-10 sm:px-8 sm:pb-12 sm:pt-14"
        >
          <div className="mx-auto w-full max-w-5xl text-center">
            <p className="mb-5 text-sm font-semibold tracking-wide text-primary">
              Todo lo que necesitas, cerca de ti
            </p>

            <h1 className="text-balance text-4xl font-bold tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
              Encuentra lo mejor de Coronel Oviedo
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">
              Descubre comercios, servicios y eventos de forma rápida y
              sencilla.
            </p>

            <form
              role="search"
              action="/explorar"
              method="get"
              className="mx-auto mt-10 grid w-full max-w-4xl gap-2 rounded-2xl border border-border bg-surface p-2 shadow-[0_18px_55px_rgba(11,31,51,0.10)] transition-shadow focus-within:shadow-[0_22px_65px_rgba(29,78,216,0.14)] sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-center"
            >
              <div className="flex min-w-0 items-center">
                <Search
                  aria-hidden="true"
                  className="ml-3 h-5 w-5 shrink-0 text-text-secondary"
                  strokeWidth={2}
                />
                <input
                  type="search"
                  name="query"
                  aria-label="Buscar en Austro"
                  placeholder="¿Qué estás buscando?"
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-foreground outline-none placeholder:text-text-secondary"
                />
              </div>

              <div className="relative border-t border-border/70 sm:border-l sm:border-t-0">
                <select
                  name="category"
                  aria-label="Seleccionar categoría"
                  defaultValue=""
                  className="h-12 w-full cursor-pointer appearance-none bg-transparent pl-4 pr-10 text-sm font-semibold text-foreground outline-none focus:text-primary"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
                  strokeWidth={2}
                />
              </div>

              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:w-auto"
              >
                Buscar
              </button>
            </form>

            <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: "Comercios",
                  icon: Store,
                  href: "/explorar?type=comercio",
                },
                {
                  label: "Servicios",
                  icon: BriefcaseBusiness,
                  href: "/explorar?type=servicio",
                },
                {
                  label: "Eventos",
                  icon: CalendarDays,
                  href: "/explorar?type=evento",
                },
                {
                  label: "Ver todo",
                  icon: Grid2X2,
                  href: "/explorar",
                },
              ].map(({ label, icon: Icon, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_30px_rgba(11,31,51,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-soft text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon
                      aria-hidden="true"
                      className="h-5 w-5"
                      strokeWidth={1.9}
                    />
                  </span>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border/60 bg-surface py-12 sm:py-14">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">
                  Descubre tu ciudad
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-foreground sm:text-3xl">
                  Publicaciones recientes
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-text-secondary sm:text-base">
                  Lugares, profesionales y actividades que puedes encontrar en
                  Coronel Oviedo.
                </p>
              </div>

              <Link
                href="/explorar"
                className="group inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
              >
                Ver todo
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  strokeWidth={2}
                />
              </Link>
            </div>

            <HomeListings
              listings={recentListings}
              unavailable={directoryUnavailable}
            />
          </div>
        </section>

        <section
          id="publicar"
          className="scroll-mt-20 bg-background px-5 py-14 sm:px-8 sm:py-16"
        >
          <div className="mx-auto w-full max-w-7xl">
            <div className="overflow-hidden rounded-3xl bg-primary px-6 py-10 shadow-[0_24px_65px_rgba(29,78,216,0.18)] sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between lg:gap-12">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold tracking-wide text-white/75">
                  Haz crecer tu presencia local
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-white sm:text-4xl">
                  Publica tu comercio, servicio o evento en Austro
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/75 sm:text-base">
                  Conecta con personas de Coronel Oviedo y permite que
                  encuentren tu propuesta de forma rápida y confiable.
                </p>
              </div>

              <div className="mt-8 flex shrink-0 flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col">
                <Link
                  href="/publicar"
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-primary transition-all hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
                >
                  Comenzar a publicar
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    strokeWidth={2}
                  />
                </Link>
                <Link
                  href="/explorar"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Explorar Austro
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
