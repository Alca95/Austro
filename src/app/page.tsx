import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Clock3,
  Map,
  MapPin,
  Search,
  Star,
  Store,
  Utensils,
} from "lucide-react";
import PublicFooter from "../components/PublicFooter";
import PublicHeader from "../components/PublicHeader";

const featuredListings = [
  {
    name: "Sabores de Oviedo",
    type: "Comercio",
    category: "Gastronomía",
    icon: Utensils,
    accent: "from-blue-50 via-sky-100 to-blue-200",
    rating: "4.8",
    status: "Abierto ahora",
    location: "1,2 km",
    verified: true,
  },
  {
    name: "Soluciones del Hogar",
    type: "Servicio",
    category: "Electricidad y reparaciones",
    icon: BriefcaseBusiness,
    accent: "from-indigo-50 via-violet-100 to-indigo-200",
    rating: "4.9",
    status: "Disponible hoy",
    location: "2,4 km",
    verified: true,
  },
  {
    name: "Feria Local de Emprendedores",
    type: "Evento",
    category: "Cultura y comunidad",
    icon: CalendarDays,
    accent: "from-cyan-50 via-sky-100 to-cyan-200",
    status: "17:00",
    location: "Centro",
    eventDate: "SÁB 08",
    verified: false,
  },
];

export default function Home() {
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
                  <option value="gastronomia">Gastronomía</option>
                  <option value="salud">Salud</option>
                  <option value="belleza">Belleza</option>
                  <option value="hogar">Hogar</option>
                  <option value="educacion">Educación</option>
                  <option value="entretenimiento">Entretenimiento</option>
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
                  label: "Ver mapa",
                  icon: Map,
                  href: "/explorar?vista=mapa",
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
                  Cerca de ti
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

            <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featuredListings.map((listing, index) => {
                const Icon = listing.icon;

                return (
                  <article
                    key={listing.name}
                    className={`group overflow-hidden rounded-3xl border border-border/80 bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_45px_rgba(11,31,51,0.09)] ${
                      index === 2 ? "md:col-span-2 lg:col-span-1" : ""
                    }`}
                  >
                    <div
                      className={`relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br ${listing.accent}`}
                    >
                      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur">
                        {listing.type}
                      </span>
                      {listing.eventDate && (
                        <span className="absolute right-4 top-4 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-bold text-primary shadow-sm">
                          {listing.eventDate}
                        </span>
                      )}
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-primary shadow-lg shadow-blue-900/10 transition-transform duration-300 group-hover:scale-105">
                        <Icon
                          aria-hidden="true"
                          className="h-7 w-7"
                          strokeWidth={1.8}
                        />
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-foreground">
                              {listing.name}
                            </h3>
                            {listing.verified && (
                              <BadgeCheck
                                aria-label="Información verificada"
                                className="h-[18px] w-[18px] shrink-0 text-primary"
                                strokeWidth={2}
                              />
                            )}
                          </div>
                          <p className="mt-1 text-sm text-text-secondary">
                            {listing.category}
                          </p>
                        </div>

                        {listing.rating && (
                          <div className="flex shrink-0 items-center gap-1 text-sm font-semibold text-foreground">
                            <Star
                              aria-hidden="true"
                              className="h-4 w-4 fill-amber-400 text-amber-400"
                            />
                            {listing.rating}
                          </div>
                        )}
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4 text-sm">
                        <span className="flex items-center gap-1.5 font-medium text-success">
                          <Clock3 aria-hidden="true" className="h-4 w-4" />
                          {listing.status}
                        </span>
                        <span className="flex items-center gap-1.5 text-text-secondary">
                          <MapPin aria-hidden="true" className="h-4 w-4" />
                          {listing.location}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
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
