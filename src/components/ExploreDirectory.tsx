"use client";

import { FormEvent, useRef, useState, useTransition } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Grid2X2,
  ImageOff,
  ListFilter,
  MapPin,
  Search,
  SlidersHorizontal,
  Store,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import ListingDetailDialog from "./ListingDetailDialog";
import type {
  PublicDirectoryCategory,
  PublicDirectoryData,
  PublicDirectoryListing,
} from "../lib/listings/public-directory";
import type { ListingType } from "../data/austroListings";

type TypeFilter = ListingType | "all";

const listingTypeLabels: Record<ListingType, string> = {
  comercio: "Comercio",
  servicio: "Servicio",
  evento: "Evento",
};

const listingIcons = {
  comercio: Store,
  servicio: BriefcaseBusiness,
  evento: CalendarDays,
};

const accentClasses: Record<ListingType, string> = {
  comercio: "from-emerald-50 via-green-100 to-emerald-200 text-emerald-700",
  servicio: "from-indigo-50 via-violet-100 to-indigo-200 text-indigo-700",
  evento: "from-orange-50 via-amber-100 to-orange-200 text-orange-700",
};

function isTypeFilter(value: string | null): value is ListingType {
  return value === "comercio" || value === "servicio" || value === "evento";
}

function formatEventDate(value: string | null) {
  if (!value) return null;

  try {
    return new Intl.DateTimeFormat("es-PY", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Asuncion",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

function categoryMatches(
  categories: PublicDirectoryCategory[],
  value: string | null,
) {
  return value && categories.some((category) => category.slug === value)
    ? value
    : "all";
}

function ListingCard({
  listing,
  onSelect,
  failedImage,
  onImageError,
}: {
  listing: PublicDirectoryListing;
  onSelect: (
    listing: PublicDirectoryListing,
    trigger: HTMLButtonElement,
  ) => void;
  failedImage: boolean;
  onImageError: (listingId: string) => void;
}) {
  const Icon = listingIcons[listing.type];
  const eventDate = formatEventDate(listing.eventStart);

  return (
    <article className="group overflow-hidden rounded-3xl border border-border/80 bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_45px_rgba(11,31,51,0.09)]">
      <div
        className={`relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br ${accentClasses[listing.type]}`}
      >
        <span className="absolute left-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur">
          {listingTypeLabels[listing.type]}
        </span>

        {eventDate && (
          <span className="absolute right-4 top-4 z-10 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-bold text-primary shadow-sm">
            {eventDate}
          </span>
        )}

        {listing.imageUrl && !failedImage ? (
          <img
            src={listing.imageUrl}
            alt={listing.imageAlt || listing.name}
            onError={() => onImageError(listing.id)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg shadow-blue-900/10 transition-transform duration-300 group-hover:scale-105">
            {failedImage ? (
              <ImageOff aria-hidden="true" className="h-7 w-7" strokeWidth={1.8} />
            ) : (
              <Icon aria-hidden="true" className="h-7 w-7" strokeWidth={1.8} />
            )}
          </div>
        )}
      </div>

      <div className="p-5">
        <h2 className="truncate font-bold text-foreground">{listing.name}</h2>
        <p className="mt-1 text-sm text-text-secondary">{listing.categoryName}</p>
        <p className="mt-4 line-clamp-2 min-h-12 text-sm leading-6 text-text-secondary">
          {listing.description}
        </p>

        <div className="mt-5 flex items-center gap-1.5 border-t border-border/60 pt-4 text-sm text-text-secondary">
          <MapPin aria-hidden="true" className="h-4 w-4" />
          {listing.neighborhood}
        </div>

        <button
          type="button"
          onClick={(event) => onSelect(listing, event.currentTarget)}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-surface-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Ver información
        </button>
      </div>
    </article>
  );
}

function DirectoryState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mt-8 flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface-soft/50 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-primary shadow-sm">
        <ListFilter aria-hidden="true" className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
        {description}
      </p>
      {action}
    </div>
  );
}

export default function ExploreDirectory({
  directory,
  directoryError,
  initialQuery,
}: {
  directory?: PublicDirectoryData;
  directoryError: string;
  initialQuery: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [draftQuery, setDraftQuery] = useState(initialQuery);
  const [selectedListing, setSelectedListing] =
    useState<PublicDirectoryListing | null>(null);
  const selectedTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const appliedQuery = searchParams.get("query") ?? "";
  const appliedType: TypeFilter = isTypeFilter(searchParams.get("type"))
    ? (searchParams.get("type") as ListingType)
    : "all";
  const appliedCategory = categoryMatches(
    directory?.categories ?? [],
    searchParams.get("category"),
  );
  const appliedPage = directory?.page ?? 1;

  function replaceUrl(changes: {
    query?: string;
    type?: TypeFilter;
    category?: string;
    page?: number;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextQuery = changes.query ?? appliedQuery;
    const nextType = changes.type ?? appliedType;
    const nextCategory = changes.category ?? appliedCategory;
    const nextPage = changes.page ?? 1;

    if (nextQuery) params.set("query", nextQuery.slice(0, 100));
    else params.delete("query");
    if (nextType !== "all") params.set("type", nextType);
    else params.delete("type");
    if (nextCategory !== "all") params.set("category", nextCategory);
    else params.delete("category");
    if (nextPage > 1) params.set("page", String(nextPage));
    else params.delete("page");
    params.delete("vista");

    startTransition(() => {
      router.replace(`/explorar${params.size ? `?${params.toString()}` : ""}`, {
        scroll: false,
      });
    });
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    replaceUrl({ query: draftQuery.trim(), page: 1 });
  }

  function resetFilters() {
    setDraftQuery("");
    replaceUrl({ query: "", type: "all", category: "all", page: 1 });
  }

  function retry() {
    startTransition(() => router.refresh());
  }

  const total = directory?.total ?? 0;
  const totalPages = directory?.totalPages ?? 1;
  const listings = directory?.listings ?? [];
  const hasFilters = Boolean(
    appliedQuery || appliedType !== "all" || appliedCategory !== "all",
  );

  return (
    <>
      <section className="border-b border-border/70 bg-surface-soft/60">
        <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-12">
          <p className="text-sm font-semibold text-primary">Explora tu ciudad</p>
          <div className="mt-2 max-w-3xl">
            <h1 className="text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-4xl">
              Encuentra comercios, servicios y eventos
            </h1>
            <p className="mt-4 text-sm leading-6 text-text-secondary sm:text-base">
              Busca propuestas locales y filtra los resultados según lo que necesitas en Coronel Oviedo.
            </p>
          </div>

          <form
            role="search"
            onSubmit={handleSearch}
            className="mt-8 grid gap-2 rounded-2xl border border-border bg-surface p-2 shadow-[0_16px_45px_rgba(11,31,51,0.08)] md:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="flex min-w-0 items-center">
              <Search aria-hidden="true" className="ml-3 h-5 w-5 shrink-0 text-text-secondary" />
              <input
                type="search"
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value.slice(0, 100))}
                aria-label="Buscar en Austro"
                placeholder="Ej.: restaurante, electricista, feria..."
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-foreground outline-none placeholder:text-text-secondary"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-7 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
              <SlidersHorizontal aria-hidden="true" className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-foreground">Filtros</h2>
            </div>
            <div className="mt-6">
              <label htmlFor="listing-type" className="text-xs font-bold uppercase tracking-[0.08em] text-text-secondary">Tipo</label>
              <div className="relative mt-2">
                <select
                  id="listing-type"
                  value={appliedType}
                  onChange={(event) => replaceUrl({ type: event.target.value as TypeFilter, page: 1 })}
                  className="h-12 w-full appearance-none rounded-xl border border-border bg-surface px-4 pr-10 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="comercio">Comercios</option>
                  <option value="servicio">Servicios</option>
                  <option value="evento">Eventos</option>
                </select>
                <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              </div>
            </div>
            <div className="mt-5">
              <label htmlFor="listing-category" className="text-xs font-bold uppercase tracking-[0.08em] text-text-secondary">Categoría</label>
              <div className="relative mt-2">
                <select
                  id="listing-category"
                  value={appliedCategory}
                  onChange={(event) => replaceUrl({ category: event.target.value, page: 1 })}
                  className="h-12 w-full appearance-none rounded-xl border border-border bg-surface px-4 pr-10 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  <option value="all">Todas las categorías</option>
                  {(directory?.categories ?? []).map((category) => (
                    <option key={category.id} value={category.slug}>{category.name}</option>
                  ))}
                </select>
                <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              </div>
            </div>
            <button type="button" onClick={resetFilters} className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold text-text-secondary transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Limpiar filtros</button>
          </aside>

          <div className="min-w-0">
            {isPending && <p className="mb-4 text-sm font-semibold text-primary" role="status">Cargando publicaciones...</p>}
            {directoryError ? (
              <DirectoryState
                title="No pudimos cargar el directorio"
                description={directoryError}
                action={<button type="button" onClick={retry} className="mt-5 text-sm font-semibold text-primary hover:text-primary-hover">Reintentar</button>}
              />
            ) : (
              <>
                <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-text-secondary"><span className="font-bold text-foreground">{total}</span> {total === 1 ? "resultado" : "resultados"}</p>
                    {appliedQuery && <p className="mt-1 text-sm text-text-secondary">Para <span className="font-semibold">“{appliedQuery}”</span></p>}
                  </div>
                  <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground"><Grid2X2 aria-hidden="true" className="h-4 w-4 text-primary" /> Más recientes</span>
                </div>

                {listings.length === 0 ? (
                  <DirectoryState
                    title={hasFilters ? "No encontramos coincidencias" : "Todavía no hay publicaciones"}
                    description={hasFilters ? "Prueba con otra búsqueda o elimina alguno de los filtros seleccionados." : "Las publicaciones aprobadas aparecerán aquí."}
                    action={hasFilters ? <button type="button" onClick={resetFilters} className="mt-5 text-sm font-semibold text-primary hover:text-primary-hover">Ver todas las publicaciones</button> : undefined}
                  />
                ) : (
                  <>
                    <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {listings.map((listing) => (
                        <ListingCard
                          key={listing.id}
                          listing={listing}
                          onSelect={(nextListing, trigger) => {
                            selectedTriggerRef.current = trigger;
                            setSelectedListing(nextListing);
                          }}
                          failedImage={failedImages.has(listing.id)}
                          onImageError={(listingId) => setFailedImages((current) => new Set(current).add(listingId))}
                        />
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <nav className="mt-8 flex items-center justify-between gap-4" aria-label="Paginación">
                        <button type="button" disabled={appliedPage <= 1 || isPending} onClick={() => replaceUrl({ page: appliedPage - 1 })} className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-45">Anterior</button>
                        <span className="text-sm text-text-secondary">Página {appliedPage} de {totalPages}</span>
                        <button type="button" disabled={appliedPage >= totalPages || isPending} onClick={() => replaceUrl({ page: appliedPage + 1 })} className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-45">Siguiente</button>
                      </nav>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {selectedListing && (
        <ListingDetailDialog
          key={selectedListing.id}
          listing={selectedListing}
          returnFocusRef={selectedTriggerRef}
          onClose={() => setSelectedListing(null)}
        />
      )}
    </>
  );
}
