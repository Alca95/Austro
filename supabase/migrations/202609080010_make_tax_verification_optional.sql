begin;

create or replace function public.submit_listing(
  target_listing_id uuid
)
returns public.listing_status
language plpgsql
security definer
set search_path = ''
as $function$
declare
  authenticated_user_id uuid;
  target_listing public.listings%rowtype;
  destination_status public.listing_status;

  generated_slug text;
  slug_prefix text;

  normalized_name text;
  normalized_neighborhood text;
  duplicate_lock_key bigint;
begin
  authenticated_user_id := auth.uid();

  if authenticated_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Debes iniciar sesión para enviar una publicación.';
  end if;

  select *
  into target_listing
  from public.listings
  where id = target_listing_id
    and owner_id = authenticated_user_id
  for update;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'La publicación no está disponible o no tienes permiso para enviarla.';
  end if;

  if target_listing.status not in (
    'draft'::public.listing_status,
    'rejected'::public.listing_status
  ) then
    raise exception using
      errcode = '22023',
      message = 'La publicación no se encuentra en un estado editable.';
  end if;


  -- =======================================================
  -- VALIDACIONES GENERALES
  -- =======================================================

  if target_listing.name is null
     or char_length(btrim(target_listing.name)) < 2 then
    raise exception using
      errcode = '22023',
      message = 'El nombre de la publicación es obligatorio.';
  end if;

  if target_listing.description is null
     or char_length(btrim(target_listing.description)) < 30 then
    raise exception using
      errcode = '22023',
      message = 'La descripción debe contener al menos 30 caracteres.';
  end if;

  if target_listing.neighborhood is null
     or btrim(target_listing.neighborhood) = '' then
    raise exception using
      errcode = '22023',
      message = 'El barrio es obligatorio.';
  end if;

  if not exists (
    select 1
    from public.categories c
    where c.id = target_listing.category_id
      and c.is_active
      and c.allowed_types @>
        array[target_listing.type]::public.listing_type[]
  ) then
    raise exception using
      errcode = '22023',
      message = 'La categoría no es válida para este tipo de publicación.';
  end if;

  if not exists (
    select 1
    from public.listing_contacts lc
    where lc.listing_id = target_listing.id
      and lc.type = 'whatsapp'::public.contact_type
      and lc.is_primary
      and btrim(lc.value) <> ''
  ) then
    raise exception using
      errcode = '22023',
      message = 'Debes registrar un contacto principal de WhatsApp.';
  end if;


  -- =======================================================
  -- VALIDACIONES POR TIPO
  -- =======================================================

  case target_listing.type
    when 'comercio'::public.listing_type then
      if target_listing.address is null
         or btrim(target_listing.address) = ''
         or target_listing.location_reference is null
         or btrim(target_listing.location_reference) = '' then
        raise exception using
          errcode = '22023',
          message = 'El comercio requiere dirección y referencia.';
      end if;

      if target_listing.invoice_status is null then
        raise exception using
          errcode = '22023',
          message = 'Debes indicar si el comercio emite factura.';
      end if;

      if not exists (
        select 1
        from public.commerce_details cd
        where cd.listing_id = target_listing.id
      ) then
        raise exception using
          errcode = '22023',
          message = 'Faltan los detalles del comercio.';
      end if;

      if not exists (
        select 1
        from public.business_hours bh
        where bh.listing_id = target_listing.id
          and bh.is_open
      ) then
        raise exception using
          errcode = '22023',
          message = 'Debes configurar al menos un día de atención.';
      end if;

    when 'servicio'::public.listing_type then
      if target_listing.service_area is null
         or btrim(target_listing.service_area) = '' then
        raise exception using
          errcode = '22023',
          message = 'Debes indicar el área de cobertura del servicio.';
      end if;

      if target_listing.invoice_status is null then
        raise exception using
          errcode = '22023',
          message = 'Debes indicar si el servicio emite factura.';
      end if;

      if not exists (
        select 1
        from public.service_details sd
        where sd.listing_id = target_listing.id
          and (
            sd.at_home
            or sd.fixed_location
            or sd.remote
          )
          and char_length(btrim(sd.availability_notes)) >= 3
      ) then
        raise exception using
          errcode = '22023',
          message = 'Faltan la modalidad o la disponibilidad del servicio.';
      end if;

    when 'evento'::public.listing_type then
      if target_listing.address is null
         or btrim(target_listing.address) = ''
         or target_listing.location_reference is null
         or btrim(target_listing.location_reference) = '' then
        raise exception using
          errcode = '22023',
          message = 'El evento requiere dirección y referencia.';
      end if;

      if not exists (
        select 1
        from public.event_details ed
        where ed.listing_id = target_listing.id
          and ed.starts_at < ed.ends_at
          and ed.ends_at > now()
          and (
            (
              ed.pricing = 'free'::public.event_pricing
              and ed.ticket_price is null
            )
            or
            (
              ed.pricing = 'paid'::public.event_pricing
              and ed.ticket_price is not null
              and ed.ticket_price > 0
            )
          )
      ) then
        raise exception using
          errcode = '22023',
          message = 'El evento debe tener fechas y precios válidos.';
      end if;

    else
      raise exception using
        errcode = '22023',
        message = 'El tipo de publicación no es compatible.';
  end case;


  -- =======================================================
  -- IMAGEN PRINCIPAL
  -- Comercio y evento requieren imagen.
  -- Servicio mantiene la imagen como opcional.
  -- =======================================================

  if target_listing.type in (
    'comercio'::public.listing_type,
    'evento'::public.listing_type
  ) and not exists (
    select 1
    from public.listing_images li
    join storage.objects so
      on so.bucket_id = 'listing-images'
     and so.name = li.storage_path
    where li.listing_id = target_listing.id
      and li.is_primary
      and so.owner = authenticated_user_id
      and so.name like target_listing.id::text || '/%'
      and lower(coalesce(so.metadata->>'mimetype', '')) in (
        'image/jpeg',
        'image/png',
        'image/webp'
      )
      and lower(so.name) ~ '\.(jpg|jpeg|png|webp)$'
      and case
        when coalesce(so.metadata->>'size', '') ~ '^[0-9]{1,7}$'
          then (so.metadata->>'size')::bigint
            between 1 and 5242880
        else false
      end
      and so.archived_at is null
      and not so.is_delete_marker
  ) then
    raise exception using
      errcode = '22023',
      message = 'Debes cargar una imagen principal válida de hasta 5 MB.';
  end if;


  -- =======================================================
  -- DETECCIÓN CONCURRENTE DE POSIBLES DUPLICADOS
  -- =======================================================

  normalized_name :=
    public.normalize_listing_match(target_listing.name);

  normalized_neighborhood :=
    public.normalize_listing_match(target_listing.neighborhood);

  duplicate_lock_key := pg_catalog.hashtextextended(
    target_listing.category_id::text
      || ':'
      || normalized_name
      || ':'
      || normalized_neighborhood,
    0
  );

  perform pg_catalog.pg_advisory_xact_lock(
    duplicate_lock_key
  );

  if exists (
    select 1
    from public.listings duplicate
    where duplicate.id <> target_listing.id
      and duplicate.status in (
        'pending'::public.listing_status,
        'published'::public.listing_status,
        'suspended'::public.listing_status
      )
      and duplicate.category_id = target_listing.category_id
      and public.normalize_listing_match(duplicate.name) =
          normalized_name
      and public.normalize_listing_match(duplicate.neighborhood) =
          normalized_neighborhood
  ) then
    destination_status := 'pending'::public.listing_status;
  else
    destination_status := 'published'::public.listing_status;
  end if;


  -- =======================================================
  -- SLUG ESTABLE
  -- =======================================================

  slug_prefix := regexp_replace(
    translate(
      lower(btrim(target_listing.name)),
      'áàäâãéèëêíìïîóòöôõúùüûñç',
      'aaaaaeeeeiiiiooooouuuunc'
    ),
    '[^a-z0-9]+',
    '-',
    'g'
  );

  slug_prefix := btrim(slug_prefix, '-');

  if slug_prefix = '' then
    slug_prefix := 'publicacion';
  end if;

  generated_slug :=
    left(slug_prefix, 80)
    || '-'
    || replace(target_listing.id::text, '-', '');


  -- =======================================================
  -- TRANSICIÓN CONTROLADA
  -- La verificación de RUC es independiente de la visibilidad.
  -- =======================================================

  update public.listings
  set
    status = destination_status,
    slug = generated_slug,
    rejection_reason = null,
    submitted_at = now(),
    published_at = case
      when destination_status =
           'published'::public.listing_status
        then now()
      else null
    end
  where id = target_listing.id;

  return destination_status;
end;
$function$;

alter function public.submit_listing(uuid)
  owner to postgres;

revoke all
on function public.submit_listing(uuid)
from public, anon, authenticated;

grant execute
on function public.submit_listing(uuid)
to authenticated;

comment on function public.submit_listing(uuid) is
'Envía una publicación a controles automáticos. El RUC es opcional y su comprobación no determina por sí sola la visibilidad.';

commit;