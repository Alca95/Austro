"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Clock3,
  Grid2X2,
  ListFilter,
  Map,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  Store,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AustroListing,
  austroListings,
  categoryOptions,
  ListingCategory,
  ListingType,
  listingTypeLabels,
} from "../data/austroListings";

type TypeFilter = ListingType | "all";
type CategoryFilter = ListingCategory | "all";
type SortOption = "relevance" | "rating" | "distance";
type ViewMode = "grid" | "map";

const accentClasses: Record<AustroListing["accent"], string> = {
  blue: "from-blue-50 via-sky-100 to-blue-200 text-blue-700",
  violet: "from-indigo-50 via-violet-100 to-indigo-200 text-violet-700",
  cyan: "from-cyan-50 via-sky-100 to-cyan-200 text-cyan-700",
  rose: "from-rose-50 via-pink-100 to-rose-200 text-rose-700",
  emerald: "from-emerald-50 via-green-100 to-emerald-200 text-emerald-700",
  amber: "from-amber-50 via-orange-100 to-amber-200 text-amber-700",
};

const listingIcons = {
  comercio: Store,
  servicio: BriefcaseBusiness,
  evento: CalendarDays,
};

function isTypeFilter(value: string | null): value is ListingType {
  return value === "comercio" || value === "servicio" || value === "evento";
}

function isCategoryFilter(value: string | null): value is ListingCategory {
  return categoryOptions.some((category) => category.value === value);
}

function ListingCard({
  listing,
  onSelect,
}: {
  listing: AustroListing;
  onSelect: (listing: AustroListing) => void;
}) {
  const Icon = listingIcons[listing.type];

  return (
    <article className="group overflow-hidden rounded-3xl border border-border/80 bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_45px_rgba(11,31,51,0.09)]">
      <div
        className={`relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br ${accentClasses[listing.accent]}`}
      >
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur">
          {listingTypeLabels[listing.type]}
        </span>

        {listing.eventDate && (
          <span className="absolute right-4 top-4 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-bold text-primary shadow-sm">
            {listing.eventDate}
          </span>
        )}

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg shadow-blue-900/10 transition-transform duration-300 group-hover:scale-105">
          <Icon aria-hidden="true" className="h-7 w-7" strokeWidth={1.8} />
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="truncate font-bold text-foreground">
                {listing.name}
              </h2>
              {listing.verified && (
                <BadgeCheck
                  aria-label="Información verificada"
                  className="h-[18px] w-[18px] shrink-0 text-primary"
                  strokeWidth={2}
                />
              )}
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              {listing.categoryLabel}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1 text-sm font-semibold text-foreground">
            <Star
              aria-hidden="true"
              className="h-4 w-4 fill-amber-400 text-amber-400"
            />
            {listing.rating.toFixed(1)}
          </div>
        </div>

        <p className="mt-4 line-clamp-2 min-h-12 text-sm leading-6 text-text-secondary">
          {listing.description}
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4 text-sm">
          <span className="flex items-center gap-1.5 font-medium text-success">
            <Clock3 aria-hidden="true" className="h-4 w-4" />
            {listing.status}
          </span>

          <span className="flex items-center gap-1.5 text-text-secondary">
            <MapPin aria-hidden="true" className="h-4 w-4" />
            {listing.distanceKm.toLocaleString("es-PY")} km
          </span>
        </div>

        <button
          type="button"
          onClick={() => onSelect(listing)}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-surface-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Ver información
        </button>
      </div>
    </article>
  );
}

export default function ExploreDirectory() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type");
  const initialCategory = searchParams.get("category");
  const initialView = searchParams.get("vista");

  const [draftQuery, setDraftQuery] = useState(searchParams.get("query") ?? "");
  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const [type, setType] = useState<TypeFilter>(
    isTypeFilter(initialType) ? initialType : "all",
  );
  const [category, setCategory] = useState<CategoryFilter>(
    isCategoryFilter(initialCategory) ? initialCategory : "all",
  );
  const [sort, setSort] = useState<SortOption>("relevance");
  const [view, setView] = useState<ViewMode>(
    initialView === "mapa" ? "map" : "grid",
  );
  const [selectedListing, setSelectedListing] = useState<AustroListing | null>(
    null,
  );

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");

    const result = austroListings.filter((listing) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          listing.name,
          listing.description,
          listing.categoryLabel,
          listing.neighborhood,
        ].some((value) =>
          value.toLocaleLowerCase("es").includes(normalizedQuery),
        );
      const matchesType = type === "all" || listing.type === type;
      const matchesCategory =
        category === "all" || listing.category === category;

      return matchesQuery && matchesType && matchesCategory;
    });

    return [...result].sort((first, second) => {
      if (sort === "rating") return second.rating - first.rating;
      if (sort === "distance") return first.distanceKm - second.distanceKm;
      return Number(second.verified) - Number(first.verified);
    });
  }, [category, query, sort, type]);

  function syncUrl(next: {
    query?: string;
    type?: TypeFilter;
    category?: CategoryFilter;
    view?: ViewMode;
  }) {
    const params = new URLSearchParams();
    const nextQuery = next.query ?? query;
    const nextType = next.type ?? type;
    const nextCategory = next.category ?? category;
    const nextView = next.view ?? view;

    if (nextQuery) params.set("query", nextQuery);
    if (nextType !== "all") params.set("type", nextType);
    if (nextCategory !== "all") params.set("category", nextCategory);
    if (nextView === "map") params.set("vista", "mapa");

    router.replace(`/explorar${params.size ? `?${params.toString()}` : ""}`, {
      scroll: false,
    });
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = draftQuery.trim();
    setQuery(nextQuery);
    syncUrl({ query: nextQuery });
  }

  function resetFilters() {
    setDraftQuery("");
    setQuery("");
    setType("all");
    setCategory("all");
    setSort("relevance");
    router.replace("/explorar", { scroll: false });
  }

  return (
    <>
      <section className="border-b border-border/70 bg-surface-soft/60">
        <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-12">
          <p className="text-sm font-semibold text-primary">
            Explora tu ciudad
          </p>
          <div className="mt-2 max-w-3xl">
            <h1 className="text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-4xl">
              Encuentra comercios, servicios y eventos
            </h1>
            <p className="mt-4 text-sm leading-6 text-text-secondary sm:text-base">
              Busca propuestas locales y filtra los resultados según lo que
              necesitas en Coronel Oviedo.
            </p>
          </div>

          <form
            role="search"
            onSubmit={handleSearch}
            className="mt-8 grid gap-2 rounded-2xl border border-border bg-surface p-2 shadow-[0_16px_45px_rgba(11,31,51,0.08)] md:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="flex min-w-0 items-center">
              <Search
                aria-hidden="true"
                className="ml-3 h-5 w-5 shrink-0 text-text-secondary"
                strokeWidth={2}
              />
              <input
                type="search"
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                aria-label="Buscar en Austro"
                placeholder="Ej.: restaurante, electricista, feria..."
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-foreground outline-none placeholder:text-text-secondary"
              />
            </div>

            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-7 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Buscar
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-12">
        <div className="grid gap-7 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start">
          <aside className="rounded-2xl border border-border/80 bg-surface p-5 lg:sticky lg:top-6">
            <div className="flex items-center gap-2">
              <SlidersHorizontal
                aria-hidden="true"
                className="h-5 w-5 text-primary"
                strokeWidth={2}
              />
              <h2 className="font-bold text-foreground">Filtros</h2>
            </div>

            <div className="mt-6">
              <label
                htmlFor="listing-type"
                className="text-xs font-bold uppercase tracking-[0.08em] text-text-secondary"
              >
                Tipo
              </label>
              <div className="relative mt-2">
                <select
                  id="listing-type"
                  value={type}
                  onChange={(event) => {
                    const value = event.target.value as TypeFilter;
                    setType(value);
                    syncUrl({ type: value });
                  }}
                  className="h-12 w-full appearance-none rounded-xl border border-border bg-surface px-4 pr-10 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="comercio">Comercios</option>
                  <option value="servicio">Servicios</option>
                  <option value="evento">Eventos</option>
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
                />
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="listing-category"
                className="text-xs font-bold uppercase tracking-[0.08em] text-text-secondary"
              >
                Categoría
              </label>
              <div className="relative mt-2">
                <select
                  id="listing-category"
                  value={category}
                  onChange={(event) => {
                    const value = event.target.value as CategoryFilter;
                    setCategory(value);
                    syncUrl({ category: value });
                  }}
                  className="h-12 w-full appearance-none rounded-xl border border-border bg-surface px-4 pr-10 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  <option value="all">Todas las categorías</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold text-text-secondary transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Limpiar filtros
            </button>
          </aside>

          <div className="min-w-0">
            <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-text-secondary">
                  <span className="font-bold text-foreground">
                    {filteredListings.length}
                  </span>{" "}
                  {filteredListings.length === 1 ? "resultado" : "resultados"}
                </p>
                {query && (
                  <p className="mt-1 text-sm text-text-secondary">
                    Para <span className="font-semibold">“{query}”</span>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="sort-results" className="sr-only">
                  Ordenar resultados
                </label>
                <div className="relative">
                  <select
                    id="sort-results"
                    value={sort}
                    onChange={(event) =>
                      setSort(event.target.value as SortOption)
                    }
                    className="h-11 appearance-none rounded-xl border border-border bg-surface pl-4 pr-9 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  >
                    <option value="relevance">Más relevantes</option>
                    <option value="rating">Mejor valorados</option>
                    <option value="distance">Más cercanos</option>
                  </select>
                  <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
                  />
                </div>

                <div className="flex rounded-xl border border-border bg-surface p-1">
                  <button
                    type="button"
                    aria-label="Ver resultados en cuadrícula"
                    aria-pressed={view === "grid"}
                    onClick={() => {
                      setView("grid");
                      syncUrl({ view: "grid" });
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                      view === "grid"
                        ? "bg-primary text-white"
                        : "text-text-secondary hover:bg-surface-soft hover:text-primary"
                    }`}
                  >
                    <Grid2X2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Ver resultados en mapa"
                    aria-pressed={view === "map"}
                    onClick={() => {
                      setView("map");
                      syncUrl({ view: "map" });
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                      view === "map"
                        ? "bg-primary text-white"
                        : "text-text-secondary hover:bg-surface-soft hover:text-primary"
                    }`}
                  >
                    <Map aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {filteredListings.length === 0 ? (
              <div className="mt-8 flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface-soft/50 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-primary shadow-sm">
                  <ListFilter aria-hidden="true" className="h-6 w-6" />
                </div>
                <h2 className="mt-5 text-xl font-bold text-foreground">
                  No encontramos resultados
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
                  Prueba con otra búsqueda o elimina alguno de los filtros
                  seleccionados.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 text-sm font-semibold text-primary hover:text-primary-hover"
                >
                  Ver todas las publicaciones
                </button>
              </div>
            ) : view === "grid" ? (
              <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onSelect={setSelectedListing}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-7 grid overflow-hidden rounded-3xl border border-border bg-surface lg:grid-cols-[300px_minmax(0,1fr)]">
                <div className="max-h-[560px] overflow-y-auto border-b border-border p-3 lg:border-b-0 lg:border-r">
                  {filteredListings.map((listing) => (
                    <button
                      key={listing.id}
                      type="button"
                      onClick={() => setSelectedListing(listing)}
                      className="w-full rounded-2xl p-4 text-left transition-colors hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span className="text-xs font-semibold text-primary">
                        {listingTypeLabels[listing.type]}
                      </span>
                      <span className="mt-1 block font-bold text-foreground">
                        {listing.name}
                      </span>
                      <span className="mt-1 flex items-center gap-1 text-sm text-text-secondary">
                        <MapPin className="h-3.5 w-3.5" />
                        {listing.neighborhood} ·{" "}
                        {listing.distanceKm.toLocaleString("es-PY")} km
                      </span>
                    </button>
                  ))}
                </div>

                <div className="relative min-h-[430px] overflow-hidden bg-[linear-gradient(30deg,rgba(29,78,216,0.04)_12%,transparent_12.5%,transparent_87%,rgba(29,78,216,0.04)_87.5%,rgba(29,78,216,0.04)),linear-gradient(150deg,rgba(29,78,216,0.04)_12%,transparent_12.5%,transparent_87%,rgba(29,78,216,0.04)_87.5%,rgba(29,78,216,0.04)),linear-gradient(30deg,rgba(29,78,216,0.04)_12%,transparent_12.5%,transparent_87%,rgba(29,78,216,0.04)_87.5%,rgba(29,78,216,0.04)),linear-gradient(150deg,rgba(29,78,216,0.04)_12%,transparent_12.5%,transparent_87%,rgba(29,78,216,0.04)_87.5%,rgba(29,78,216,0.04))] bg-[length:80px_140px]">
                  <div className="absolute inset-x-0 top-1/3 h-4 rotate-[-7deg] bg-white/80 shadow-sm" />
                  <div className="absolute inset-y-0 left-1/2 w-4 rotate-12 bg-white/80 shadow-sm" />

                  {filteredListings.map((listing, index) => (
                    <button
                      key={listing.id}
                      type="button"
                      aria-label={`Ver ${listing.name}`}
                      onClick={() => setSelectedListing(listing)}
                      style={{
                        left: `${14 + ((index * 29) % 68)}%`,
                        top: `${14 + ((index * 23) % 68)}%`,
                      }}
                      className="absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-primary text-white shadow-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <MapPin aria-hidden="true" className="h-4 w-4" />
                    </button>
                  ))}

                  <span className="absolute bottom-4 right-4 rounded-xl bg-surface/95 px-3 py-2 text-xs font-semibold text-text-secondary shadow-sm backdrop-blur">
                    Vista referencial de Coronel Oviedo
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {selectedListing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="listing-dialog-title"
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedListing(null);
          }}
        >
          <div className="w-full max-w-lg rounded-t-3xl bg-surface p-6 shadow-2xl sm:rounded-3xl sm:p-7">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-sm font-semibold text-primary">
                  {listingTypeLabels[selectedListing.type]}
                </p>
                <h2
                  id="listing-dialog-title"
                  className="mt-1 text-2xl font-bold tracking-[-0.03em] text-foreground"
                >
                  {selectedListing.name}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Cerrar información"
                onClick={() => setSelectedListing(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:bg-surface-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-5 text-sm leading-6 text-text-secondary">
              {selectedListing.description}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-surface-soft p-4">
              <div>
                <dt className="text-xs font-semibold text-text-secondary">
                  Ubicación
                </dt>
                <dd className="mt-1 text-sm font-bold text-foreground">
                  {selectedListing.neighborhood}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-text-secondary">
                  Valoración
                </dt>
                <dd className="mt-1 text-sm font-bold text-foreground">
                  {selectedListing.rating.toFixed(1)} ·{" "}
                  {selectedListing.reviews} opiniones
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-text-secondary">
                  Disponibilidad
                </dt>
                <dd className="mt-1 text-sm font-bold text-foreground">
                  {selectedListing.status}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-text-secondary">
                  Distancia
                </dt>
                <dd className="mt-1 text-sm font-bold text-foreground">
                  {selectedListing.distanceKm.toLocaleString("es-PY")} km
                </dd>
              </div>
            </dl>

            <Link
              href="/iniciar-sesion"
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Contactar
            </Link>
            <p className="mt-3 text-center text-xs text-text-secondary">
              Inicia sesión para acceder a los datos de contacto verificados.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
