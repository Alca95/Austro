"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  ExternalLink,
  ImageOff,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Store,
  X,
} from "lucide-react";
import type { PublicDirectoryListing } from "../lib/listings/public-directory";
import type {
  PublicDetailContact,
  PublicDetailData,
  PublicDetailSection,
} from "../lib/listings/public-detail-types";

const listingTypeLabels = {
  comercio: "Comercio",
  servicio: "Servicio",
  evento: "Evento",
} as const;

const paymentMethodLabels: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia bancaria",
  debit: "Tarjeta de débito",
  credit: "Tarjeta de crédito",
  qr: "Pago con QR",
  mobile: "Billetera móvil",
  other: "Otro",
};

const socialNetworkLabels: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  other: "Otra red social",
};

const weekdayLabels = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

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

function formatPrice(value: number | null) {
  if (value === null || !Number.isFinite(value)) return null;

  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(value);
}

function isHttpsUrl(value: string | null) {
  if (!value) return false;

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getContactHref(contact: PublicDetailContact) {
  if (contact.type === "whatsapp" && /^\+595\d{9}$/.test(contact.value)) {
    return `https://wa.me/${contact.value.replace(/\D/g, "")}`;
  }

  if (contact.type === "phone" && /^\+?\d{6,15}$/.test(contact.value)) {
    return `tel:${contact.value}`;
  }

  if (contact.type === "email" && isValidEmail(contact.value)) {
    return `mailto:${contact.value}`;
  }

  return null;
}

function displayContactType(type: string) {
  if (type === "whatsapp") return "WhatsApp";
  if (type === "phone") return "Teléfono";
  if (type === "email") return "Correo";
  return "Contacto";
}

function displayNetwork(network: string) {
  return socialNetworkLabels[network] ?? "Red social";
}

function displayPaymentMethod(method: string) {
  return paymentMethodLabels[method] ?? "Medio de pago no especificado";
}

function Feature({ children }: { children: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-text-secondary">
      <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-success" />
      {children}
    </li>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border/70 pt-5">
      <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-primary">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function SectionUnavailable() {
  return (
    <p className="text-sm text-text-secondary">
      No pudimos cargar esta sección. Inténtalo nuevamente más tarde.
    </p>
  );
}

function EmptyValue() {
  return <p className="text-sm text-text-secondary">No informado.</p>;
}

function ValidatedLink({
  href,
  children,
  external = false,
}: {
  href: string | null;
  children: React.ReactNode;
  external?: boolean;
}) {
  if (!href) return <span className="break-words">{children}</span>;

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="break-words font-semibold text-primary hover:text-primary-hover"
    >
      {children}
    </a>
  );
}

function DetailImage({
  image,
  listingName,
  failed,
}: {
  image: PublicDetailData["image"];
  listingName: string;
  failed: boolean;
}) {
  const [loadFailed, setLoadFailed] = useState(false);
  const imageFailed = failed || loadFailed;

  return (
    <div className="flex min-h-36 items-center justify-center">
      {image?.url && !imageFailed ? (
        <img
          src={image.url}
          alt={image.alt || listingName}
          className="max-h-64 w-full object-cover"
          onError={() => setLoadFailed(true)}
        />
      ) : imageFailed ? (
        <div
          className="flex flex-col items-center gap-2 px-4 py-6 text-center text-sm text-text-secondary"
          role="status"
        >
          <ImageOff aria-hidden="true" className="h-8 w-8" />
          <span>No pudimos cargar la imagen.</span>
        </div>
      ) : (
        <Store aria-hidden="true" className="h-8 w-8 text-primary" />
      )}
    </div>
  );
}

function DetailContent({ detail }: { detail: PublicDetailData }) {
  const hasFailed = (section: PublicDetailSection) =>
    detail.failedSections.includes(section);
  const image = detail.image;
  const websiteHref = isHttpsUrl(detail.website) ? detail.website : null;
  const hasDetailEmailInContacts = Boolean(
    detail.email &&
      detail.contacts.some(
        (contact) =>
          contact.type === "email" &&
          contact.value.trim().toLocaleLowerCase() ===
            detail.email?.trim().toLocaleLowerCase(),
      ),
  );
  const showStandaloneEmail = Boolean(
    detail.email && !hasDetailEmailInContacts,
  );
  const hasVisibleContacts = detail.contacts.length > 0 || showStandaloneEmail;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface-soft">
        <DetailImage
          key={`${detail.id}:${image?.url ?? ""}`}
          image={image}
          listingName={detail.name}
          failed={hasFailed("image")}
        />
      </div>

      <Section title="Información general">
        <div className="space-y-3 text-sm text-text-secondary">
          <p className="text-base font-semibold text-foreground">{detail.name}</p>
          <p className="whitespace-pre-line leading-6">{detail.description}</p>
          {detail.additionalInfo && (
            <p className="whitespace-pre-line leading-6">{detail.additionalInfo}</p>
          )}
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="font-semibold">Tipo</dt>
              <dd>{listingTypeLabels[detail.type]}</dd>
            </div>
            <div>
              <dt className="font-semibold">Categoría</dt>
              <dd>{hasFailed("category") ? "No disponible" : detail.categoryName || "No informado."}</dd>
            </div>
          </dl>
        </div>
      </Section>

      <Section title="Ubicación y cobertura">
        <div className="space-y-2 text-sm text-text-secondary">
          <p className="flex items-start gap-2">
            <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {[detail.address, detail.neighborhood, detail.city]
                .filter(Boolean)
                .join(", ") || "No informado."}
            </span>
          </p>
          {detail.locationReference && <p>Referencia: {detail.locationReference}</p>}
          {detail.serviceArea && <p>Área de cobertura: {detail.serviceArea}</p>}
          {!detail.address && !detail.neighborhood && !detail.city && !detail.locationReference && !detail.serviceArea && <EmptyValue />}
        </div>
      </Section>

      <Section title="Contactos">
        <div className="space-y-3">
          {hasFailed("contacts") && <SectionUnavailable />}
          {hasVisibleContacts ? (
            <ul className="space-y-3">
              {detail.contacts.map((contact, index) => {
                const href = getContactHref(contact);
                const Icon = contact.type === "whatsapp" ? MessageCircle : contact.type === "email" ? Mail : Phone;

                return (
                  <li key={`${contact.type}-${contact.value}-${index}`} className="flex items-start gap-2 text-sm text-text-secondary">
                    <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>
                      <span className="block font-semibold text-foreground">{contact.label || displayContactType(contact.type)}</span>
                      <ValidatedLink href={href} external={contact.type === "whatsapp"}>{contact.value}</ValidatedLink>
                    </span>
                  </li>
                );
              })}
              {showStandaloneEmail && detail.email && (
                <li className="flex items-start gap-2 text-sm text-text-secondary">
                  <Mail aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span className="block font-semibold text-foreground">Correo</span>
                    <ValidatedLink href={isValidEmail(detail.email) ? `mailto:${detail.email}` : null}>
                      {detail.email}
                    </ValidatedLink>
                  </span>
                </li>
              )}
            </ul>
          ) : !hasFailed("contacts") ? (
            <EmptyValue />
          ) : null}
        </div>
      </Section>

      {detail.type === "comercio" && (
        <Section title="Horarios">
          {hasFailed("businessHours") ? (
            <SectionUnavailable />
          ) : detail.businessHours.length ? (
            <ul className="space-y-2 text-sm text-text-secondary">
              {weekdayLabels.map((day, index) => {
                const hours = detail.businessHours.find((item) => item.dayOfWeek === index + 1);
                return (
                  <li key={day} className="flex justify-between gap-4 border-b border-border/50 pb-2 last:border-0">
                    <span className="font-semibold text-foreground">{day}</span>
                    <span>
                      {!hours ? "No informado" : !hours.isOpen ? "Cerrado" : hours.is24Hours ? "24 horas" : `${hours.openTime || "No informado"} - ${hours.closeTime || "No informado"}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyValue />
          )}
        </Section>
      )}

      {detail.type === "servicio" && (
        <Section title="Disponibilidad">
          {hasFailed("service") ? (
            <SectionUnavailable />
          ) : detail.service ? (
            <div className="space-y-3 text-sm text-text-secondary">
              <ul className="grid gap-2 sm:grid-cols-2">
                {detail.service.atHome && <Feature>Atención a domicilio</Feature>}
                {detail.service.fixedLocation && <Feature>Atención en local</Feature>}
                {detail.service.remote && <Feature>Atención remota</Feature>}
                {detail.service.requiresAppointment && <Feature>Requiere agendamiento</Feature>}
                {detail.service.offersQuote && <Feature>Ofrece presupuesto</Feature>}
                {detail.service.urgentService && <Feature>Servicio urgente</Feature>}
              </ul>
              {detail.service.availabilityNotes && <p className="leading-6">{detail.service.availabilityNotes}</p>}
              {formatPrice(detail.service.priceFrom) && <p>Desde {formatPrice(detail.service.priceFrom)}</p>}
            </div>
          ) : (
            <EmptyValue />
          )}
        </Section>
      )}

      {detail.type === "evento" && (
        <Section title="Información del evento">
          {hasFailed("event") ? (
            <SectionUnavailable />
          ) : detail.event ? (
            <div className="space-y-3 text-sm text-text-secondary">
              <div className="flex items-start gap-2"><CalendarDays aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{formatDate(detail.event.startsAt) || "Fecha no informada"}{detail.event.endsAt ? ` - ${formatDate(detail.event.endsAt) || "Fecha no informada"}` : ""}</span></div>
              <p>{detail.event.pricing === "free" ? "Entrada gratuita" : detail.event.pricing === "paid" ? formatPrice(detail.event.ticketPrice) || "Precio no informado" : "Precio no informado"}</p>
              {detail.event.recommendedAudience && <p>Público recomendado: {detail.event.recommendedAudience}</p>}
              {detail.event.ageRestriction && <p>Edad: {detail.event.ageRestriction}</p>}
              {detail.event.limitedCapacity && <p>Capacidad limitada</p>}
              {detail.event.ticketUrl && <ValidatedLink href={isHttpsUrl(detail.event.ticketUrl) ? detail.event.ticketUrl : null} external>Entradas <ExternalLink aria-hidden="true" className="inline h-3.5 w-3.5" /></ValidatedLink>}
            </div>
          ) : (
            <EmptyValue />
          )}
        </Section>
      )}

      {detail.type === "comercio" && (
        <Section title="Características">
          {hasFailed("commerce") ? (
            <SectionUnavailable />
          ) : detail.commerce ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {detail.commerce.delivery && <Feature>Entrega a domicilio</Feature>}
              {detail.commerce.pickup && <Feature>Retiro en local</Feature>}
              {detail.commerce.reservations && <Feature>Reservas</Feature>}
              {detail.commerce.parking && <Feature>Estacionamiento</Feature>}
              {detail.commerce.accessibility && <Feature>Accesibilidad</Feature>}
            </ul>
          ) : (
            <EmptyValue />
          )}
        </Section>
      )}

      {detail.type === "evento" && detail.event && (detail.event.parking || detail.event.accessibility) && (
        <Section title="Características">
          <ul className="grid gap-2 sm:grid-cols-2">
            {detail.event.parking && <Feature>Estacionamiento</Feature>}
            {detail.event.accessibility && <Feature>Accesibilidad</Feature>}
          </ul>
        </Section>
      )}

      {(detail.invoiceStatus || detail.paymentMethods.length || hasFailed("payments")) && (
        <Section title="Facturación y medios de pago">
          <div className="space-y-3 text-sm text-text-secondary">
            {detail.invoiceStatus && (
              <p>{detail.invoiceStatus === "yes" ? "Emite factura" : detail.invoiceStatus === "no" ? "No emite factura" : "No informado"}</p>
            )}
            {hasFailed("payments") ? (
              <SectionUnavailable />
            ) : detail.paymentMethods.length ? (
              <ul className="flex flex-wrap gap-2">
                {detail.paymentMethods.map((payment, index) => <li key={`${payment.method}-${index}`} className="rounded-lg bg-surface-soft px-3 py-2">{displayPaymentMethod(payment.method)}</li>)}
              </ul>
            ) : (
              <EmptyValue />
            )}
          </div>
        </Section>
      )}

      {(detail.website || detail.socialLinks.length || hasFailed("socialLinks")) && (
        <Section title="Redes y sitio web">
          <div className="space-y-3 text-sm text-text-secondary">
            {detail.website && <p>Sitio web: <ValidatedLink href={websiteHref} external>{detail.website}</ValidatedLink></p>}
            {hasFailed("socialLinks") ? (
              <SectionUnavailable />
            ) : detail.socialLinks.length ? (
              detail.socialLinks.map((link, index) => <p key={`${link.network}-${index}`}>{displayNetwork(link.network)}: <ValidatedLink href={isHttpsUrl(link.url) ? link.url : null} external>{link.url}</ValidatedLink></p>)
            ) : !detail.website ? (
              <EmptyValue />
            ) : null}
          </div>
        </Section>
      )}

      {detail.afterHoursMessages && (
        <p className="flex items-center gap-2 border-t border-border/70 pt-5 text-sm text-text-secondary"><Clock3 aria-hidden="true" className="h-4 w-4 text-primary" /> Recibe mensajes fuera de horario.</p>
      )}
    </div>
  );
}

export default function ListingDetailDialog({
  listing,
  returnFocusRef,
  onClose,
}: {
  listing: PublicDirectoryListing;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [detail, setDetail] = useState<PublicDetailData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error" | "missing">("loading");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) dialog.showModal();
    dialog.focus();

    const controller = new AbortController();
    let active = true;
    setDetail(null);
    setState("loading");

    fetch(`/api/listings/${encodeURIComponent(listing.id)}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const body = (await response.json()) as { listing?: PublicDetailData };
        if (response.status === 404) {
          if (active) setState("missing");
          return;
        }
        if (!response.ok || !body.listing) throw new Error("DETAIL_UNAVAILABLE");
        if (active) {
          setDetail(body.listing);
          setState("ready");
        }
      })
      .catch(() => {
        if (active && !controller.signal.aborted) setState("error");
      });

    return () => {
      active = false;
      controller.abort();
      if (dialog.open) dialog.close();
    };
  }, [listing.id, reloadToken]);

  function closeDialog() {
    if (dialogRef.current?.open) dialogRef.current.close();
    onClose();
    requestAnimationFrame(() => returnFocusRef.current?.focus());
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }

    if (event.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>("button, a[href], [tabindex]:not([tabindex='-1'])"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="listing-detail-title"
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      onKeyDown={handleKeyDown}
      className="m-0 max-h-[min(90vh,760px)] w-full max-w-2xl overflow-hidden rounded-t-3xl bg-surface p-0 text-foreground shadow-2xl backdrop:bg-slate-950/45 sm:m-auto sm:rounded-3xl"
    >
      <div className="flex max-h-[min(90vh,760px)] flex-col">
        <header className="flex shrink-0 items-start justify-between gap-5 border-b border-border/70 p-6 sm:p-7">
          <div>
            <p className="text-sm font-semibold text-primary">{listingTypeLabels[listing.type]}</p>
            <h2 id="listing-detail-title" className="mt-1 text-2xl font-bold tracking-[-0.03em]">{listing.name}</h2>
          </div>
          <button type="button" aria-label="Cerrar información" onClick={closeDialog} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:bg-surface-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><X aria-hidden="true" className="h-5 w-5" /></button>
        </header>
        <div className="min-h-0 overflow-y-auto p-6 sm:p-7">
          {state === "loading" && <div className="flex min-h-72 items-center justify-center text-sm text-text-secondary" role="status">Cargando información...</div>}
          {state === "error" && <div className="flex min-h-72 flex-col items-center justify-center text-center"><p className="text-sm text-text-secondary">No pudimos cargar esta publicación.</p><button type="button" onClick={() => { setState("loading"); setDetail(null); setReloadToken((token) => token + 1); }} className="mt-5 text-sm font-semibold text-primary hover:text-primary-hover">Reintentar</button></div>}
          {state === "missing" && <div className="flex min-h-72 items-center justify-center text-center text-sm text-text-secondary">Esta publicación ya no está disponible.</div>}
          {state === "ready" && detail && <DetailContent detail={detail} />}
        </div>
      </div>
    </dialog>
  );
}
