import "server-only";

import { createClient } from "../../lib/supabase/server";
import type { ListingType } from "../../data/austroListings";

const PAGE_SIZE = 24;
const MAX_QUERY_LENGTH = 100;
const SIGNED_URL_EXPIRY_SECONDS = 3600;
const MAX_PAGE = Math.floor(Number.MAX_SAFE_INTEGER / PAGE_SIZE);

export type PublicDirectoryCategory = {
  id: string;
  name: string;
  slug: string;
  allowedTypes: ListingType[];
  displayOrder: number;
};

export type PublicDirectoryListing = {
  id: string;
  slug: string | null;
  type: ListingType;
  name: string;
  description: string;
  neighborhood: string;
  categoryId: string;
  categoryName: string;
  imageUrl: string | null;
  imageAlt: string | null;
  eventStart: string | null;
  eventEnd: string | null;
};

export type PublicDirectoryData = {
  listings: PublicDirectoryListing[];
  categories: PublicDirectoryCategory[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PublicDirectoryParams = {
  query?: string;
  type?: string;
  category?: string;
  page?: string;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  allowed_types: ListingType[];
  is_active: boolean;
  display_order: number;
};

type ListingRow = {
  id: string;
  slug: string | null;
  type: ListingType;
  name: string;
  description: string;
  neighborhood: string;
  category_id: string;
  published_at: string | null;
};

type ImageRow = {
  listing_id: string;
  storage_path: string;
  alt_text: string | null;
};

type EventRow = {
  listing_id: string;
  starts_at: string | null;
  ends_at: string | null;
};

function escapeLikePattern(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function escapePostgrestQuotedLiteral(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function normalizeQuery(value: string | undefined) {
  return (value ?? "").trim().slice(0, MAX_QUERY_LENGTH);
}

function normalizePage(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return 1;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= MAX_PAGE
    ? parsed
    : 1;
}

function getErrorCode(error: unknown) {
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

function isListingType(value: string | undefined): value is ListingType {
  return value === "comercio" || value === "servicio" || value === "evento";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function getPublicDirectory(
  params: PublicDirectoryParams,
): Promise<PublicDirectoryData> {
  const supabase = await createClient();
  const query = normalizeQuery(params.query);
  const selectedType = isListingType(params.type) ? params.type : null;
  const requestedCategory = (params.category ?? "").trim().slice(0, 100);
  const page = normalizePage(params.page);

  if (query.includes("*")) {
    throw new Error("Public directory search does not support '*' characters");
  }

  const categoriesResult = await supabase
    .from("categories")
    .select("id, name, slug, allowed_types, is_active, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("id", { ascending: true });

  if (categoriesResult.error) throw categoriesResult.error;

  const categories = ((categoriesResult.data ?? []) as CategoryRow[]).map(
    (category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      allowedTypes: category.allowed_types,
      displayOrder: category.display_order,
    }),
  );

  const categoryBySlug = new Map(
    categories.map((category) => [category.slug, category]),
  );
  const selectedCategory = requestedCategory
    ? categoryBySlug.get(requestedCategory) ?? null
    : null;

  if (requestedCategory && !selectedCategory) {
    return {
      listings: [],
      categories,
      total: 0,
      page: 1,
      pageSize: PAGE_SIZE,
      totalPages: 1,
    };
  }

  const createListingQuery = (head = false) => {
    const listingQuery = supabase
      .from("listings")
      .select(
        "id, slug, type, name, description, neighborhood, category_id, published_at",
        head ? { count: "exact", head: true } : { count: "exact" },
      )
      .eq("status", "published");

    if (selectedType) listingQuery.eq("type", selectedType);
    if (selectedCategory) listingQuery.eq("category_id", selectedCategory.id);

    if (query) {
      const pattern = `"%${escapePostgrestQuotedLiteral(escapeLikePattern(query))}%"`;
      const normalizedQuery = query.toLocaleLowerCase("es");
      const matchingCategoryIds = categories
        .filter(
          (category) =>
            category.name.toLocaleLowerCase("es").includes(normalizedQuery) ||
            category.slug.toLocaleLowerCase("es").includes(normalizedQuery),
        )
        .map((category) => category.id)
        .filter(isUuid);
      const categoryFilter = matchingCategoryIds.length
        ? `,category_id.in.(${matchingCategoryIds.join(",")})`
        : "";

      listingQuery.or(
        `name.ilike.${pattern},description.ilike.${pattern},neighborhood.ilike.${pattern}${categoryFilter}`,
      );
    }

    if (!head) {
      listingQuery
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("id", { ascending: false });
    }

    return listingQuery;
  };

  const getRange = (requestedPage: number) => {
    const from = (requestedPage - 1) * PAGE_SIZE;
    return { from, to: from + PAGE_SIZE - 1 };
  };

  const countResult = await createListingQuery(true);
  if (countResult.error) throw countResult.error;

  const total = countResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const returnedPage = total === 0 ? 1 : Math.min(page, totalPages);

  if (total === 0) {
    return {
      listings: [],
      categories,
      total,
      page: 1,
      pageSize: PAGE_SIZE,
      totalPages,
    };
  }

  const returnedRange = getRange(returnedPage);
  const listingsResult = await createListingQuery().range(
    returnedRange.from,
    returnedRange.to,
  );

  if (listingsResult.error) throw listingsResult.error;

  const listingRows = (listingsResult.data ?? []) as ListingRow[];

  const listingIds = listingRows.map((listing) => listing.id);

  const imagesByListing = new Map<string, ImageRow>();
  const eventsByListing = new Map<string, EventRow>();

  if (listingIds.length) {
    const [imagesResult, eventsResult] = await Promise.all([
      supabase
        .from("listing_images")
        .select("listing_id, storage_path, alt_text")
        .in("listing_id", listingIds)
        .eq("is_primary", true),
      supabase
        .from("event_details")
        .select("listing_id, starts_at, ends_at")
        .in("listing_id", listingIds),
    ]);

    if (imagesResult.error) {
      console.error("[public-directory] secondary query failed", {
        operation: "listing_images.select_primary",
        code: getErrorCode(imagesResult.error),
      });
    } else {
      for (const image of (imagesResult.data ?? []) as ImageRow[]) {
        imagesByListing.set(image.listing_id, image);
      }
    }

    if (eventsResult.error) {
      console.error("[public-directory] secondary query failed", {
        operation: "event_details.select",
        code: getErrorCode(eventsResult.error),
      });
    } else {
      for (const event of (eventsResult.data ?? []) as EventRow[]) {
        eventsByListing.set(event.listing_id, event);
      }
    }
  }

  const imagePaths = listingRows
    .map((listing) => imagesByListing.get(listing.id)?.storage_path)
    .filter((path): path is string => Boolean(path));
  const signedUrlsByPath = new Map<string, string>();

  if (imagePaths.length) {
    const signedUrlsResult = await supabase.storage
      .from("listing-images")
      .createSignedUrls(imagePaths, SIGNED_URL_EXPIRY_SECONDS);

    if (signedUrlsResult.error) {
      console.error("[public-directory] signed URL request failed", {
        operation: "listing-images.create_signed_urls",
        code: getErrorCode(signedUrlsResult.error),
      });
    } else {
      for (const signedUrl of signedUrlsResult.data ?? []) {
        const signedUrlResult = signedUrl as typeof signedUrl & {
          error?: unknown;
        };

        if (signedUrlResult.error) {
          console.error("[public-directory] signed URL item failed", {
            operation: "listing-images.create_signed_urls.item",
            code: getErrorCode(signedUrlResult.error),
          });
        } else if (signedUrl.path && signedUrl.signedUrl) {
          signedUrlsByPath.set(signedUrl.path, signedUrl.signedUrl);
        }
      }
    }
  }

  const listings = listingRows.map((listing) => {
    const image = imagesByListing.get(listing.id);
    const event = eventsByListing.get(listing.id);
    const category = categories.find((item) => item.id === listing.category_id);

    return {
      id: listing.id,
      slug: listing.slug,
      type: listing.type,
      name: listing.name,
      description: listing.description,
      neighborhood: listing.neighborhood,
      categoryId: listing.category_id,
      categoryName: category?.name ?? "Sin categoría",
      imageUrl: image ? signedUrlsByPath.get(image.storage_path) ?? null : null,
      imageAlt: image?.alt_text ?? null,
      eventStart: listing.type === "evento" ? event?.starts_at ?? null : null,
      eventEnd: listing.type === "evento" ? event?.ends_at ?? null : null,
    } satisfies PublicDirectoryListing;
  });

  return {
    listings,
    categories,
    total,
    page: returnedPage,
    pageSize: PAGE_SIZE,
    totalPages,
  };
}
