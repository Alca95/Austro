begin;

create unique index if not exists listings_slug_unique
on public.listings (slug)
where slug is not null;

create unique index if not exists listing_contacts_one_primary
on public.listing_contacts (listing_id)
where is_primary;

create unique index if not exists listing_images_one_primary
on public.listing_images (listing_id)
where is_primary;

alter table public.listings
  add constraint listings_website_https
  check (
    website is null
    or website ~* '^https://[^[:space:]]+$'
  );

alter table public.listings
  add constraint listings_email_shape
  check (
    email is null
    or email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  );

alter table public.listing_contacts
  add constraint listing_contacts_phone_shape
  check (
    (
      type = 'whatsapp'::public.contact_type
      and value ~ '^\+595[0-9]{9}$'
    )
    or
    (
      type = 'phone'::public.contact_type
      and value ~ '^\+?[0-9]{6,15}$'
    )
  );

alter table public.listing_verifications
  add constraint listing_verifications_number_length
  check (
    char_length(document_number) between 4 and 10
  );

alter table public.listing_social_links
  drop constraint if exists listing_social_links_url_check;

alter table public.listing_social_links
  add constraint listing_social_links_url_https
  check (
    url ~* '^https://[^[:space:]]+$'
  );

alter table public.event_details
  drop constraint if exists event_paid_has_price;

alter table public.event_details
  drop constraint if exists event_details_ticket_price_check;

alter table public.event_details
  add constraint event_details_pricing_consistency
  check (
    (
      pricing = 'free'::public.event_pricing
      and ticket_price is null
    )
    or
    (
      pricing = 'paid'::public.event_pricing
      and ticket_price is not null
      and ticket_price > 0
    )
  );

alter table public.event_details
  add constraint event_details_ticket_url_https
  check (
    ticket_url is null
    or ticket_url ~* '^https://[^[:space:]]+$'
  );

alter table public.service_details
  drop constraint if exists service_details_price_from_check;

alter table public.service_details
  add constraint service_details_price_from_positive
  check (
    price_from is null
    or price_from > 0
  );

commit;