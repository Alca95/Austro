"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  Store,
} from "lucide-react";
import type { PublicDirectoryListing } from "../lib/listings/public-directory";
import ListingDetailDialog from "./ListingDetailDialog";

const listingTypeLabels: Record<PublicDirectoryListing["type"], string> = {
  comercio: "Comercio",
  servicio: "Servicio",
  evento: "Evento",
};

const listingIcons = {
  comercio: Store,
  servicio: BriefcaseBusiness,
  evento: CalendarDays,
};

const accentClasses: Record<PublicDirectoryListing["type"], string> = {
  comercio: "from-blue-50 via-sky-100 to-blue-200",
  servicio: "from-indigo-50 via-violet-100 to-indigo-200",
  evento: "from-cyan-50 via-sky-100 to-cyan-200",
};

function formatEventDate(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("es-PY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Asuncion",
  }).format(date);
}

function HomeListingsState({
  unavailable,
}: {
  unavailable: boolean;
}) {
  return (
    <div className="mt-9 flex min-h-48 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-background/60 px-6 text-center">
      <p className="text-sm leading-6 text-text-secondary">
        {unavailable
          ? "No pudimos cargar las publicaciones recientes."
          : "Todavía no hay publicaciones disponibles."}
      </p>
      {unavailable && (
        <Link
          href="/explorar"
          className="mt-4 text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Explorar publicaciones
        </Link>
      )}
    </div>
  );
}

export default function HomeListings({
  listings,
  unavailable,
}: {
  listings: PublicDirectoryListing[];
  unavailable: boolean;
}) {
  const [selectedListing, setSelectedListing] =
    useState<PublicDirectoryListing | null>(null);
  const selectedTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  if (unavailable || listings.length === 0) {
    return <HomeListingsState unavailable={unavailable} />;
  }

  return (
    <>
      <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing, index) => {
          const Icon = listingIcons[listing.type];
          const eventDate = formatEventDate(listing.eventStart);
          const imageFailed = failedImages.has(listing.id);

          return (
            <article
              key={listing.id}
              className={`group flex overflow-hidden rounded-3xl border border-border/80 bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_45px_rgba(11,31,51,0.09)] ${
                index === 2 ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <div
                  className={`relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br ${accentClasses[listing.type]}`}
                >
                  <span className="absolute left-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur">
                    {listingTypeLabels[listing.type]}
                  </span>
                  {eventDate && (
                    <span className="absolute right-4 top-4 z-10 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-bold text-primary shadow-sm">
                      {eventDate}
                    </span>
                  )}
                  {listing.imageUrl && !imageFailed ? (
                    <img
                      src={listing.imageUrl}
                      alt={listing.imageAlt || listing.name}
                      onError={() =>
                        setFailedImages((current) =>
                          new Set(current).add(listing.id),
                        )
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-primary shadow-lg shadow-blue-900/10 transition-transform duration-300 group-hover:scale-105">
                      <Icon
                        aria-hidden="true"
                        className="h-7 w-7"
                        strokeWidth={1.8}
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="truncate font-bold text-foreground">
                    {listing.name}
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    {listing.categoryName}
                  </p>
                  <p className="mt-5 flex items-center gap-1.5 border-t border-border/60 pt-4 text-sm text-text-secondary">
                    <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />
                    <span className="truncate">{listing.neighborhood}</span>
                  </p>
                  <button
                    type="button"
                    onClick={(event) => {
                      selectedTriggerRef.current = event.currentTarget;
                      setSelectedListing(listing);
                    }}
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-surface-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Ver información
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

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
