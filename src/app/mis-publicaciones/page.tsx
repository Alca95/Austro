import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  FileText,
  Plus,
  Store,
} from "lucide-react";
import type { ListingType } from "../../data/austroListings";
import PublicFooter from "../../components/PublicFooter";
import PublicHeader from "../../components/PublicHeader";
import { createClient } from "../../lib/supabase/server";

const PAGE_SIZE = 12;
const MAX_PAGE = Math.floor(Number.MAX_SAFE_INTEGER / PAGE_SIZE);
const LISTING_COLUMNS =
  "id, name, type, status, updated_at, submitted_at, published_at";

type ListingStatus =
  | "draft"
  | "pending"
  | "published"
  | "rejected"
  | "suspended"
  | "archived";

type OwnerListing = {
  id: string;
  name: string | null;
  type: ListingType;
  status: ListingStatus;
  updated_at: string | null;
  submitted_at: string | null;
  published_at: string | null;
};

type OwnerDirectory = {
  listings: OwnerListing[];
  total: number;
  page: number;
  totalPages: number;
};

type MyListingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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

const statusLabels: Record<ListingStatus, string> = {
  draft: "Borrador",
  pending: "En revisión",
  published: "Publicada",
  rejected: "Rechazada",
  suspended: "Suspendida",
  archived: "Archivada",
};

const statusClasses: Record<ListingStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-orange-100 text-orange-800",
  archived: "bg-slate-200 text-slate-700",
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizePage(value: string | undefined) {
  if (!value || !/^[1-9]\d*$/.test(value)) return 1;

  const page = Number(value);
  return Number.isSafeInteger(page) && page <= MAX_PAGE ? page : 1;
}

function formatDate(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("es-PY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Asuncion",
  }).format(date);
}

function pageHref(page: number) {
  return page > 1 ? `/mis-publicaciones?page=${page}` : "/mis-publicaciones";
}

function DateItem({ label, value }: { label: string; value: string | null }) {
  const formattedDate = formatDate(value);
  if (!formattedDate) return null;

  return (
    <div>
      <dt className="font-semibold text-foreground">{label}</dt>
      <dd className="mt-1">{formattedDate}</dd>
    </div>
  );
}

export default async function MyListingsPage({
  searchParams,
}: MyListingsPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/iniciar-sesion");
  }

  const resolvedSearchParams = await searchParams;
  const requestedPage = normalizePage(
    firstSearchParam(resolvedSearchParams.page),
  );
  let directory: OwnerDirectory | null = null;
  let directoryError = false;

  try {
    const countResult = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id);

    if (countResult.error) throw countResult.error;

    const total = countResult.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = total === 0 ? 1 : Math.min(requestedPage, totalPages);
    let listings: OwnerListing[] = [];

    if (total > 0) {
      const from = (page - 1) * PAGE_SIZE;
      const listingsResult = await supabase
        .from("listings")
        .select(LISTING_COLUMNS)
        .eq("owner_id", user.id)
        .order("updated_at", { ascending: false, nullsFirst: false })
        .order("id", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (listingsResult.error) throw listingsResult.error;
      listings = (listingsResult.data ?? []) as OwnerListing[];
    }

    directory = { listings, total, page, totalPages };
  } catch {
    directoryError = true;
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-4xl">
              Mis publicaciones
            </h1>
            <p className="mt-3 text-sm leading-6 text-text-secondary sm:text-base">
              Consulta el estado de las publicaciones asociadas a tu cuenta.
            </p>
          </div>
          <Link
            href="/publicar"
            className="inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Crear publicación
          </Link>
        </div>

        {directoryError ? (
          <section className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-border bg-surface px-6 text-center">
            <CircleAlert aria-hidden="true" className="h-8 w-8 text-primary" />
            <h2 className="mt-4 text-xl font-bold text-foreground">
              No pudimos cargar tus publicaciones
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
              Inténtalo nuevamente. Tus publicaciones permanecen guardadas en
              tu cuenta.
            </p>
            <Link
              href="/mis-publicaciones"
              className="mt-5 text-sm font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Volver a intentar
            </Link>
          </section>
        ) : directory && directory.listings.length === 0 ? (
          <section className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface-soft/50 px-6 text-center">
            <FileText aria-hidden="true" className="h-8 w-8 text-primary" />
            <h2 className="mt-4 text-xl font-bold text-foreground">
              Todavía no tienes publicaciones
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
              Cuando crees una publicación, podrás consultar su estado aquí.
            </p>
          </section>
        ) : directory ? (
          <>
            <p className="mt-8 text-sm text-text-secondary">
              <span className="font-bold text-foreground">
                {directory.total}
              </span>{" "}
              {directory.total === 1 ? "publicación" : "publicaciones"}
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {directory.listings.map((listing) => {
                const Icon = listingIcons[listing.type];
                const displayName = listing.name?.trim() || "Publicación sin título";

                return (
                  <article
                    key={listing.id}
                    className="rounded-3xl border border-border/80 bg-surface p-5 shadow-[0_18px_45px_rgba(11,31,51,0.05)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-soft text-primary">
                        <Icon aria-hidden="true" className="h-5 w-5" />
                      </span>
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusClasses[listing.status]}`}
                      >
                        {statusLabels[listing.status]}
                      </span>
                    </div>

                    <h2 className="mt-5 break-words text-lg font-bold text-foreground">
                      {displayName}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-primary">
                      {listingTypeLabels[listing.type]}
                    </p>

                    <dl className="mt-5 grid gap-3 border-t border-border/60 pt-4 text-sm text-text-secondary">
                      <DateItem label="Actualizada" value={listing.updated_at} />
                      <DateItem label="Enviada" value={listing.submitted_at} />
                      <DateItem label="Publicada" value={listing.published_at} />
                    </dl>
                  </article>
                );
              })}
            </div>

            {directory.totalPages > 1 && (
              <nav
                className="mt-8 flex items-center justify-between gap-4"
                aria-label="Paginación de mis publicaciones"
              >
                {directory.page > 1 ? (
                  <Link
                    href={pageHref(directory.page - 1)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-foreground hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                    Anterior
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-sm text-text-secondary">
                  Página {directory.page} de {directory.totalPages}
                </span>
                {directory.page < directory.totalPages ? (
                  <Link
                    href={pageHref(directory.page + 1)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-foreground hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Siguiente
                    <ChevronRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        ) : null}
      </main>

      <PublicFooter />
    </div>
  );
}
