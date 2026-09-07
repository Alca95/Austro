begin;

-- =========================================================
-- 1. FECHA DE ENVÍO Y COLA DE MODERACIÓN
-- =========================================================

alter table public.listings
  add column if not exists submitted_at timestamp with time zone;

create index if not exists listings_review_queue_idx
on public.listings (status, submitted_at desc)
where status in ('pending', 'rejected', 'suspended');

comment on column public.listings.submitted_at is
'Fecha del último envío de la publicación a los controles automáticos.';


-- =========================================================
-- 2. NORMALIZACIÓN PARA DETECTAR DUPLICADOS
-- =========================================================

create or replace function public.normalize_listing_match(
  source_value text
)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $function$
  select btrim(
    regexp_replace(
      regexp_replace(
        translate(
          lower(btrim(coalesce(source_value, ''))),
          'áàäâãéèëêíìïîóòöôõúùüûñç',
          'aaaaaeeeeiiiiooooouuuunc'
        ),
        '[^a-z0-9]+',
        ' ',
        'g'
      ),
      '\s+',
      ' ',
      'g'
    )
  );
$function$;

alter function public.normalize_listing_match(text)
  owner to postgres;

revoke all
on function public.normalize_listing_match(text)
from public, anon, authenticated;


-- =========================================================
-- 3. PROTECCIÓN DE CAMPOS INTERNOS
-- =========================================================

create or replace function public.guard_listing_system_fields()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  /*
   * current_user = postgres solamente ocurre dentro de una
   * operación privilegiada controlada, como submit_listing().
   *
   * No se utilizan variables GUC app.* porque pueden ser
   * manipuladas desde una sesión SQL.
   */
  if current_user = 'postgres'
     or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.owner_id := auth.uid();
    new.status := 'draft';
    new.city := 'Coronel Oviedo';
    new.slug := null;
    new.rejection_reason := null;
    new.published_at := null;
    new.submitted_at := null;
    new.created_at := now();

    return new;
  end if;

  new.id := old.id;
  new.owner_id := old.owner_id;
  new.type := old.type;
  new.status := old.status;
  new.city := old.city;
  new.slug := old.slug;
  new.rejection_reason := old.rejection_reason;
  new.published_at := old.published_at;
  new.submitted_at := old.submitted_at;
  new.created_at := old.created_at;

  return new;
end;
$function$;

alter function public.guard_listing_system_fields()
  owner to postgres;


-- =========================================================
-- 4. ENVÍO SEGURO DE PUBLICACIONES
-- =========================================================

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

  if target_listing.status not in ('draft', 'rejected') then
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

      /*
       * Una verificación pendiente permite publicar,
       * pero no concede la insignia de verificado.
       */
      if not exists (
        select 1
        from public.listing_verifications lv
        where lv.listing_id = target_listing.id
          and lv.status in (
            'pending'::public.verification_status,
            'verified'::public.verification_status
          )
      ) then
        raise exception using
          errcode = '22023',
          message = 'Debes registrar un documento válido del comercio.';
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
  -- VALIDACIÓN SEGURA DE IMAGEN PRINCIPAL
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

  /*
   * Publicaciones equivalentes obtienen la misma llave.
   * Esto impide que dos envíos simultáneos superen el
   * control de duplicados antes de que uno sea confirmado.
   */
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
    destination_status := 'pending';
  else
    destination_status := 'published';
  end if;


  -- =======================================================
  -- SLUG ESTABLE Y SIN COLISIONES ENTRE PUBLICACIONES
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
  -- =======================================================

  update public.listings
  set
    status = destination_status,
    slug = generated_slug,
    rejection_reason = null,
    submitted_at = now(),
    published_at = case
      when destination_status = 'published'::public.listing_status
        then now()
      else null
    end
  where id = target_listing.id;

  return destination_status;
end;
$function$;


-- =========================================================
-- 5. PROPIETARIO Y PERMISOS
-- =========================================================

alter function public.submit_listing(uuid)
  owner to postgres;

revoke all
on function public.submit_listing(uuid)
from public, anon, authenticated;

grant execute
on function public.submit_listing(uuid)
to authenticated;

commit;