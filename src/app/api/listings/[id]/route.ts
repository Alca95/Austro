import { NextResponse } from "next/server";

import {
  getPublicListingDetail,
  isPublicListingId,
} from "@/lib/listings/public-detail";

function jsonResponse(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      Pragma: "no-cache",
    },
  });
}

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

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!isPublicListingId(id)) {
    return jsonResponse({ error: "INVALID_ID" }, 400);
  }

  try {
    const detail = await getPublicListingDetail(id);

    if (!detail) {
      return jsonResponse({ error: "LISTING_NOT_FOUND" }, 404);
    }

    return jsonResponse({ listing: detail }, 200);
  } catch (error) {
    console.error("[public-listing-detail] request failed", {
      operation: "get_public_listing_detail",
      code: errorCode(error),
    });

    return jsonResponse(
      {
        error: "DETAIL_UNAVAILABLE",
        message: "No pudimos cargar la publicación.",
      },
      500,
    );
  }
}
