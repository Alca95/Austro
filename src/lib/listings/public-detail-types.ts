import type { ListingType } from "../../data/austroListings";

export type PublicDetailSection =
  | "category"
  | "contacts"
  | "payments"
  | "socialLinks"
  | "image"
  | "commerce"
  | "businessHours"
  | "service"
  | "event";

export type PublicDetailContact = {
  type: string;
  value: string;
  label: string | null;
  isPrimary: boolean;
  displayOrder: number;
};

export type PublicDetailPaymentMethod = {
  method: string;
};

export type PublicDetailSocialLink = {
  network: string;
  url: string;
  displayOrder: number;
};

export type PublicDetailImage = {
  url: string | null;
  alt: string | null;
};

export type PublicDetailBusinessHours = {
  dayOfWeek: number;
  isOpen: boolean;
  is24Hours: boolean;
  openTime: string | null;
  closeTime: string | null;
};

export type PublicDetailData = {
  id: string;
  slug: string | null;
  type: ListingType;
  name: string;
  description: string;
  additionalInfo: string | null;
  categoryId: string;
  categoryName: string | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  locationReference: string | null;
  serviceArea: string | null;
  latitude: number | null;
  longitude: number | null;
  email: string | null;
  website: string | null;
  invoiceStatus: string | null;
  afterHoursMessages: boolean;
  contacts: PublicDetailContact[];
  paymentMethods: PublicDetailPaymentMethod[];
  socialLinks: PublicDetailSocialLink[];
  image: PublicDetailImage | null;
  businessHours: PublicDetailBusinessHours[];
  commerce: {
    delivery: boolean;
    pickup: boolean;
    reservations: boolean;
    parking: boolean;
    accessibility: boolean;
  } | null;
  service: {
    atHome: boolean;
    fixedLocation: boolean;
    remote: boolean;
    requiresAppointment: boolean;
    offersQuote: boolean;
    urgentService: boolean;
    availabilityNotes: string | null;
    priceFrom: number | null;
    currencyCode: string | null;
  } | null;
  event: {
    startsAt: string | null;
    endsAt: string | null;
    pricing: string | null;
    ticketPrice: number | null;
    currencyCode: string | null;
    ticketUrl: string | null;
    limitedCapacity: boolean;
    recommendedAudience: string | null;
    ageRestriction: string | null;
    parking: boolean;
    accessibility: boolean;
  } | null;
  failedSections: PublicDetailSection[];
};
