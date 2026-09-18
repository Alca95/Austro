import "server-only";

import { createClient } from "../../lib/supabase/server";
import type { ListingType } from "../../data/austroListings";
import type {
  PublicDetailBusinessHours,
  PublicDetailContact,
  PublicDetailData,
  PublicDetailImage,
  PublicDetailPaymentMethod,
  PublicDetailSection,
  PublicDetailSocialLink,
} from "./public-detail-types";

const SIGNED_URL_EXPIRY_SECONDS = 3600;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LISTING_COLUMNS =
  "id, slug, type, name, description, additional_info, category_id, city, neighborhood, address, location_reference, service_area, latitude, longitude, email, website, invoice_status, after_hours_messages";

type ListingRow = {
  id: string;
  slug: string | null;
  type: ListingType;
  name: string;
  description: string;
  additional_info: string | null;
  category_id: string;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  location_reference: string | null;
  service_area: string | null;
  latitude: number | null;
  longitude: number | null;
  email: string | null;
  website: string | null;
  invoice_status: string | null;
  after_hours_messages: boolean;
};

type CategoryRow = { id: string; name: string };
type ContactRow = {
  type: string;
  value: string;
  label: string | null;
  is_primary: boolean;
  display_order: number;
};
type PaymentRow = { method: string };
type SocialRow = { network: string; url: string; display_order: number };
type ImageRow = { storage_path: string; alt_text: string | null };
type CommerceRow = {
  delivery: boolean;
  pickup: boolean;
  reservations: boolean;
  parking: boolean;
  accessibility: boolean;
};
type HoursRow = {
  day_of_week: number;
  is_open: boolean;
  is_24_hours: boolean;
  open_time: string | null;
  close_time: string | null;
};
type ServiceRow = {
  at_home: boolean;
  fixed_location: boolean;
  remote: boolean;
  requires_appointment: boolean;
  offers_quote: boolean;
  urgent_service: boolean;
  availability_notes: string | null;
  price_from: number | null;
  currency_code: string | null;
};
type EventRow = {
  starts_at: string | null;
  ends_at: string | null;
  pricing: string | null;
  ticket_price: number | null;
  currency_code: string | null;
  ticket_url: string | null;
  limited_capacity: boolean;
  recommended_audience: string | null;
  age_restriction: string | null;
  parking: boolean;
  accessibility: boolean;
};

function errorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return "UNKNOWN";
}

function logFailure(operation: string, error: unknown) {
  console.error("[public-detail] query failed", {
    operation,
    code: errorCode(error),
  });
}

function isUsableImageUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function emptyDetailSections(): PublicDetailSection[] {
  return [];
}

function mapContact(row: ContactRow): PublicDetailContact {
  return {
    type: row.type,
    value: row.value,
    label: row.label,
    isPrimary: row.is_primary,
    displayOrder: row.display_order,
  };
}

function mapHours(row: HoursRow): PublicDetailBusinessHours {
  return {
    dayOfWeek: row.day_of_week,
    isOpen: row.is_open,
    is24Hours: row.is_24_hours,
    openTime: row.open_time,
    closeTime: row.close_time,
  };
}

function mapSocialLink(row: SocialRow): PublicDetailSocialLink {
  return {
    network: row.network,
    url: row.url,
    displayOrder: row.display_order,
  };
}

function mapEvent(row: EventRow): NonNullable<PublicDetailData["event"]> {
  return {
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    pricing: row.pricing,
    ticketPrice: row.ticket_price,
    currencyCode: row.currency_code,
    ticketUrl: row.ticket_url,
    limitedCapacity: row.limited_capacity,
    recommendedAudience: row.recommended_audience,
    ageRestriction: row.age_restriction,
    parking: row.parking,
    accessibility: row.accessibility,
  };
}

export function isPublicListingId(value: string) {
  return UUID_PATTERN.test(value);
}

export async function getPublicListingDetail(
  listingId: string,
): Promise<PublicDetailData | null> {
  const supabase = await createClient();
  const listingResult = await supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .eq("id", listingId)
    .eq("status", "published")
    .maybeSingle();

  if (listingResult.error) {
    logFailure("listings.select_published", listingResult.error);
    throw listingResult.error;
  }

  const listing = listingResult.data as ListingRow | null;
  if (!listing) return null;

  const failedSections = emptyDetailSections();
  const [categoryResult, contactsResult, paymentsResult, socialLinksResult, imageResult] =
    await Promise.all([
      supabase.from("categories").select("id, name").eq("id", listing.category_id).maybeSingle(),
      supabase
        .from("listing_contacts")
        .select("type, value, label, is_primary, display_order")
        .eq("listing_id", listing.id)
        .order("display_order", { ascending: true }),
      supabase
        .from("listing_payment_methods")
        .select("method")
        .eq("listing_id", listing.id),
      supabase
        .from("listing_social_links")
        .select("network, url, display_order")
        .eq("listing_id", listing.id)
        .order("display_order", { ascending: true }),
      supabase
        .from("listing_images")
        .select("storage_path, alt_text, is_primary, display_order")
        .eq("listing_id", listing.id)
        .eq("is_primary", true)
        .order("display_order", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

  const category = categoryResult.data as CategoryRow | null;
  if (categoryResult.error) {
    logFailure("categories.select", categoryResult.error);
    failedSections.push("category");
  }

  let contacts: PublicDetailContact[] = [];
  if (contactsResult.error) {
    logFailure("listing_contacts.select", contactsResult.error);
    failedSections.push("contacts");
  } else {
    contacts = ((contactsResult.data ?? []) as ContactRow[]).map(mapContact);
  }

  let paymentMethods: PublicDetailPaymentMethod[] = [];
  if (paymentsResult.error) {
    logFailure("listing_payment_methods.select", paymentsResult.error);
    failedSections.push("payments");
  } else {
    paymentMethods = (paymentsResult.data ?? []) as PaymentRow[];
  }

  let socialLinks: PublicDetailSocialLink[] = [];
  if (socialLinksResult.error) {
    logFailure("listing_social_links.select", socialLinksResult.error);
    failedSections.push("socialLinks");
  } else {
    socialLinks = ((socialLinksResult.data ?? []) as SocialRow[]).map(
      mapSocialLink,
    );
  }

  let image: PublicDetailImage | null = null;
  let imagePath: string | null = null;
  if (imageResult.error) {
    logFailure("listing_images.select_primary", imageResult.error);
    failedSections.push("image");
  } else {
    const imageRow = imageResult.data as ImageRow | null;
    if (imageRow) {
      image = { url: null, alt: imageRow.alt_text };
      imagePath = imageRow.storage_path;
    }
  }

  if (imagePath) {
    const signedUrlsResult = await supabase.storage
      .from("listing-images")
      .createSignedUrls([imagePath], SIGNED_URL_EXPIRY_SECONDS);

    if (signedUrlsResult.error) {
      logFailure("listing-images.create_signed_urls", signedUrlsResult.error);
      if (!failedSections.includes("image")) failedSections.push("image");
    } else {
      const signedUrl = signedUrlsResult.data?.[0] as
        | { path?: string; signedUrl?: string; error?: unknown }
        | undefined;
      if (signedUrl?.error) {
        logFailure("listing-images.create_signed_urls.item", signedUrl.error);
        if (!failedSections.includes("image")) failedSections.push("image");
      } else if (isUsableImageUrl(signedUrl?.signedUrl) && image) {
        image = { ...image, url: signedUrl.signedUrl };
      } else {
        logFailure("listing-images.create_signed_urls.missing_url", {
          code: "SIGNED_URL_MISSING",
        });
        if (!failedSections.includes("image")) failedSections.push("image");
      }
    }
  }

  let businessHours: PublicDetailBusinessHours[] = [];
  let commerce: PublicDetailData["commerce"] = null;
  let service: PublicDetailData["service"] = null;
  let event: PublicDetailData["event"] = null;

  if (listing.type === "comercio") {
    const [commerceResult, hoursResult] = await Promise.all([
      supabase
        .from("commerce_details")
        .select("delivery, pickup, reservations, parking, accessibility")
        .eq("listing_id", listing.id)
        .maybeSingle(),
      supabase
        .from("business_hours")
        .select("day_of_week, is_open, is_24_hours, open_time, close_time")
        .eq("listing_id", listing.id)
        .order("day_of_week", { ascending: true }),
    ]);

    if (commerceResult.error) {
      logFailure("commerce_details.select", commerceResult.error);
      failedSections.push("commerce");
    } else if (commerceResult.data) {
      const row = commerceResult.data as CommerceRow;
      commerce = row;
    }

    if (hoursResult.error) {
      logFailure("business_hours.select", hoursResult.error);
      failedSections.push("businessHours");
    } else {
      businessHours = ((hoursResult.data ?? []) as HoursRow[]).map(mapHours);
    }
  }

  if (listing.type === "servicio") {
    const serviceResult = await supabase
      .from("service_details")
      .select(
        "at_home, fixed_location, remote, requires_appointment, offers_quote, urgent_service, availability_notes, price_from, currency_code",
      )
      .eq("listing_id", listing.id)
      .maybeSingle();

    if (serviceResult.error) {
      logFailure("service_details.select", serviceResult.error);
      failedSections.push("service");
    } else if (serviceResult.data) {
      const row = serviceResult.data as ServiceRow;
      service = {
        atHome: row.at_home,
        fixedLocation: row.fixed_location,
        remote: row.remote,
        requiresAppointment: row.requires_appointment,
        offersQuote: row.offers_quote,
        urgentService: row.urgent_service,
        availabilityNotes: row.availability_notes,
        priceFrom: row.price_from,
        currencyCode: row.currency_code,
      };
    }
  }

  if (listing.type === "evento") {
    const eventResult = await supabase
      .from("event_details")
      .select(
        "starts_at, ends_at, pricing, ticket_price, currency_code, ticket_url, limited_capacity, recommended_audience, age_restriction, parking, accessibility",
      )
      .eq("listing_id", listing.id)
      .maybeSingle();

    if (eventResult.error) {
      logFailure("event_details.select", eventResult.error);
      failedSections.push("event");
    } else if (eventResult.data) {
      const row = eventResult.data as EventRow;
      event = mapEvent(row);
    }
  }

  return {
    id: listing.id,
    slug: listing.slug,
    type: listing.type,
    name: listing.name,
    description: listing.description,
    additionalInfo: listing.additional_info,
    categoryId: listing.category_id,
    categoryName: category?.name ?? null,
    city: listing.city,
    neighborhood: listing.neighborhood,
    address: listing.address,
    locationReference: listing.location_reference,
    serviceArea: listing.service_area,
    latitude: listing.latitude,
    longitude: listing.longitude,
    email: listing.email,
    website: listing.website,
    invoiceStatus: listing.invoice_status,
    afterHoursMessages: listing.after_hours_messages,
    contacts,
    paymentMethods,
    socialLinks,
    image,
    businessHours,
    commerce,
    service,
    event,
    failedSections,
  };
}
