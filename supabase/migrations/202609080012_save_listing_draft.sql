begin;

create or replace function public.save_listing_draft(
  target_listing_id uuid,
  draft_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := auth.uid();
  saved_listing_id uuid;
  current_listing public.listings%rowtype;
  selected_type public.listing_type;
  selected_category_id uuid;

  contacts_payload jsonb;
  hours_payload jsonb;
  payments_payload jsonb;
  socials_payload jsonb;
begin
  if actor_id is null then
    raise exception using
      errcode = '42501',
      message = 'Debes iniciar sesión para guardar una publicación.';
  end if;

  if jsonb_typeof(draft_payload) is distinct from 'object' then
    raise exception using
      errcode = '22023',
      message = 'Los datos de la publicación no son válidos.';
  end if;

  selected_type :=
    nullif(btrim(draft_payload ->> 'type'), '')::public.listing_type;

  selected_category_id :=
    nullif(btrim(draft_payload ->> 'category_id'), '')::uuid;

  if selected_type is null then
    raise exception using
      errcode = '22023',
      message = 'Debes seleccionar el tipo de publicación.';
  end if;

  if selected_category_id is null then
    raise exception using
      errcode = '22023',
      message = 'Debes seleccionar una categoría.';
  end if;

  if not exists (
    select 1
    from public.categories c
    where c.id = selected_category_id
      and c.is_active
      and c.allowed_types @>
        array[selected_type]::public.listing_type[]
  ) then
    raise exception using
      errcode = '22023',
      message = 'La categoría no corresponde al tipo de publicación.';
  end if;

  if jsonb_typeof(draft_payload -> 'contacts')
     is distinct from 'array' then
    raise exception using
      errcode = '22023',
      message = 'El formulario debe incluir la lista completa de contactos.';
  end if;

  if jsonb_typeof(draft_payload -> 'business_hours')
     is distinct from 'array' then
    raise exception using
      errcode = '22023',
      message = 'El formulario debe incluir la configuración completa de horarios.';
  end if;

  if jsonb_typeof(draft_payload -> 'payment_methods')
     is distinct from 'array' then
    raise exception using
      errcode = '22023',
      message = 'El formulario debe incluir la lista completa de métodos de pago.';
  end if;

  if jsonb_typeof(draft_payload -> 'social_links')
     is distinct from 'array' then
    raise exception using
      errcode = '22023',
      message = 'El formulario debe incluir la lista completa de redes sociales.';
  end if;

  contacts_payload := draft_payload -> 'contacts';
  hours_payload := draft_payload -> 'business_hours';
  payments_payload := draft_payload -> 'payment_methods';
  socials_payload := draft_payload -> 'social_links';

  if jsonb_array_length(contacts_payload) > 10 then
    raise exception using
      errcode = '22023',
      message = 'Solo puedes registrar hasta 10 contactos.';
  end if;

  if jsonb_array_length(hours_payload) > 7 then
    raise exception using
      errcode = '22023',
      message = 'Los horarios no pueden superar los 7 días.';
  end if;

  if jsonb_array_length(payments_payload) > 7 then
    raise exception using
      errcode = '22023',
      message = 'La lista de métodos de pago no es válida.';
  end if;

  if jsonb_array_length(socials_payload) > 10 then
    raise exception using
      errcode = '22023',
      message = 'Solo puedes registrar hasta 10 enlaces sociales.';
  end if;

  if (
    select count(*)
    from jsonb_array_elements(contacts_payload) as contact(item)
    where coalesce((item ->> 'is_primary')::boolean, false)
  ) > 1 then
    raise exception using
      errcode = '22023',
      message = 'Solo puede existir un contacto principal.';
  end if;

  if (
    select count(*)
    from (
      select item ->> 'day_of_week'
      from jsonb_array_elements(hours_payload) as hour(item)
      group by item ->> 'day_of_week'
      having count(*) > 1
    ) duplicated_days
  ) > 0 then
    raise exception using
      errcode = '22023',
      message = 'No puedes repetir un día en los horarios.';
  end if;

  if target_listing_id is null then
    insert into public.listings (
      owner_id,
      type,
      category_id,
      status,
      name,
      slug,
      description,
      additional_info,
      city,
      neighborhood,
      address,
      location_reference,
      service_area,
      latitude,
      longitude,
      email,
      website,
      invoice_status,
      after_hours_messages,
      rejection_reason,
      published_at,
      submitted_at
    )
    values (
      actor_id,
      selected_type,
      selected_category_id,
      'draft'::public.listing_status,
      nullif(btrim(draft_payload ->> 'name'), ''),
      null,
      nullif(btrim(draft_payload ->> 'description'), ''),
      nullif(btrim(draft_payload ->> 'additional_info'), ''),
      'Coronel Oviedo',
      nullif(btrim(draft_payload ->> 'neighborhood'), ''),
      nullif(btrim(draft_payload ->> 'address'), ''),
      nullif(btrim(draft_payload ->> 'location_reference'), ''),
      nullif(btrim(draft_payload ->> 'service_area'), ''),
      nullif(btrim(draft_payload ->> 'latitude'), '')::numeric,
      nullif(btrim(draft_payload ->> 'longitude'), '')::numeric,
      lower(nullif(btrim(draft_payload ->> 'email'), '')),
      nullif(btrim(draft_payload ->> 'website'), ''),
      case
        when selected_type in (
          'comercio'::public.listing_type,
          'servicio'::public.listing_type
        )
        then nullif(
          btrim(draft_payload ->> 'invoice_status'),
          ''
        )::public.invoice_status
        else null
      end,
      coalesce(
        (draft_payload ->> 'after_hours_messages')::boolean,
        false
      ),
      null,
      null,
      null
    )
    returning id into saved_listing_id;
  else
    select *
    into current_listing
    from public.listings
    where id = target_listing_id
      and owner_id = actor_id
    for update;

    if not found then
      raise exception using
        errcode = '42501',
        message = 'No puedes modificar esta publicación.';
    end if;

    if current_listing.status not in (
      'draft'::public.listing_status,
      'rejected'::public.listing_status
    ) then
      raise exception using
        errcode = '22023',
        message = 'La publicación ya no se encuentra en estado editable.';
    end if;

    if current_listing.type <> selected_type then
      raise exception using
        errcode = '22023',
        message = 'No puedes cambiar el tipo de una publicación existente.';
    end if;

    update public.listings
    set
      category_id = selected_category_id,
      name = nullif(btrim(draft_payload ->> 'name'), ''),
      description =
        nullif(btrim(draft_payload ->> 'description'), ''),
      additional_info =
        nullif(btrim(draft_payload ->> 'additional_info'), ''),
      neighborhood =
        nullif(btrim(draft_payload ->> 'neighborhood'), ''),
      address =
        nullif(btrim(draft_payload ->> 'address'), ''),
      location_reference =
        nullif(btrim(draft_payload ->> 'location_reference'), ''),
      service_area =
        nullif(btrim(draft_payload ->> 'service_area'), ''),
      latitude =
        nullif(btrim(draft_payload ->> 'latitude'), '')::numeric,
      longitude =
        nullif(btrim(draft_payload ->> 'longitude'), '')::numeric,
      email =
        lower(nullif(btrim(draft_payload ->> 'email'), '')),
      website =
        nullif(btrim(draft_payload ->> 'website'), ''),
      invoice_status =
        case
          when selected_type in (
            'comercio'::public.listing_type,
            'servicio'::public.listing_type
          )
          then nullif(
            btrim(draft_payload ->> 'invoice_status'),
            ''
          )::public.invoice_status
          else null
        end,
      after_hours_messages =
        coalesce(
          (draft_payload ->> 'after_hours_messages')::boolean,
          false
        )
    where id = current_listing.id;

    saved_listing_id := current_listing.id;
  end if;

  delete from public.commerce_details
  where listing_id = saved_listing_id;

  delete from public.service_details
  where listing_id = saved_listing_id;

  delete from public.event_details
  where listing_id = saved_listing_id;

  if selected_type = 'comercio'::public.listing_type then
    if jsonb_typeof(draft_payload -> 'commerce') is distinct from 'object' then
      raise exception using
        errcode = '22023',
        message = 'Faltan los detalles del comercio.';
    end if;

    insert into public.commerce_details (
      listing_id,
      delivery,
      pickup,
      reservations,
      parking,
      accessibility
    )
    values (
      saved_listing_id,
      coalesce(
        (draft_payload #>> '{commerce,delivery}')::boolean,
        false
      ),
      coalesce(
        (draft_payload #>> '{commerce,pickup}')::boolean,
        false
      ),
      coalesce(
        (draft_payload #>> '{commerce,reservations}')::boolean,
        false
      ),
      coalesce(
        (draft_payload #>> '{commerce,parking}')::boolean,
        false
      ),
      coalesce(
        (draft_payload #>> '{commerce,accessibility}')::boolean,
        false
      )
    );

  elsif selected_type = 'servicio'::public.listing_type then
    if jsonb_typeof(draft_payload -> 'service') is distinct from 'object' then
      raise exception using
        errcode = '22023',
        message = 'Faltan los detalles del servicio.';
    end if;

    if not (
      coalesce(
        (draft_payload #>> '{service,at_home}')::boolean,
        false
      )
      or coalesce(
        (draft_payload #>> '{service,fixed_location}')::boolean,
        false
      )
      or coalesce(
        (draft_payload #>> '{service,remote}')::boolean,
        false
      )
    ) then
      raise exception using
        errcode = '22023',
        message = 'Debes seleccionar al menos una modalidad de atención.';
    end if;

    if coalesce(
      char_length(
        btrim(
          draft_payload #>> '{service,availability_notes}'
        )
      ),
      0
    ) not between 3 and 300 then
      raise exception using
        errcode = '22023',
        message = 'La disponibilidad debe contener entre 3 y 300 caracteres.';
    end if;

    insert into public.service_details (
      listing_id,
      at_home,
      fixed_location,
      remote,
      requires_appointment,
      offers_quote,
      urgent_service,
      availability_notes,
      price_from,
      currency_code
    )
    values (
      saved_listing_id,
      coalesce(
        (draft_payload #>> '{service,at_home}')::boolean,
        false
      ),
      coalesce(
        (draft_payload #>> '{service,fixed_location}')::boolean,
        false
      ),
      coalesce(
        (draft_payload #>> '{service,remote}')::boolean,
        false
      ),
      coalesce(
        (draft_payload #>> '{service,requires_appointment}')::boolean,
        false
      ),
      coalesce(
        (draft_payload #>> '{service,offers_quote}')::boolean,
        false
      ),
      coalesce(
        (draft_payload #>> '{service,urgent_service}')::boolean,
        false
      ),
      btrim(
        draft_payload #>> '{service,availability_notes}'
      ),
      nullif(
        btrim(draft_payload #>> '{service,price_from}'),
        ''
      )::bigint,
      'PYG'
    );

  elsif selected_type = 'evento'::public.listing_type then
    if jsonb_typeof(draft_payload -> 'event') is distinct from 'object' then
      raise exception using
        errcode = '22023',
        message = 'Faltan los detalles del evento.';
    end if;

    insert into public.event_details (
      listing_id,
      starts_at,
      ends_at,
      pricing,
      ticket_price,
      currency_code,
      ticket_url,
      limited_capacity,
      recommended_audience,
      age_restriction,
      parking,
      accessibility
    )
    values (
      saved_listing_id,
      nullif(
        btrim(draft_payload #>> '{event,starts_at}'),
        ''
      )::timestamptz,
      nullif(
        btrim(draft_payload #>> '{event,ends_at}'),
        ''
      )::timestamptz,
      nullif(
        btrim(draft_payload #>> '{event,pricing}'),
        ''
      )::public.event_pricing,
      nullif(
        btrim(draft_payload #>> '{event,ticket_price}'),
        ''
      )::bigint,
      'PYG',
      nullif(
        btrim(draft_payload #>> '{event,ticket_url}'),
        ''
      ),
      coalesce(
        (draft_payload #>> '{event,limited_capacity}')::boolean,
        false
      ),
      nullif(
        btrim(draft_payload #>> '{event,recommended_audience}'),
        ''
      ),
      nullif(
        btrim(draft_payload #>> '{event,age_restriction}'),
        ''
      ),
      coalesce(
        (draft_payload #>> '{event,parking}')::boolean,
        false
      ),
      coalesce(
        (draft_payload #>> '{event,accessibility}')::boolean,
        false
      )
    );
  else
    raise exception using
      errcode = '22023',
      message = 'El tipo de publicación no está soportado.';
  end if;

  delete from public.listing_contacts
  where listing_id = saved_listing_id;

  insert into public.listing_contacts (
    listing_id,
    type,
    value,
    label,
    is_primary,
    display_order
  )
  select
    saved_listing_id,
    (contact.item ->> 'type')::public.contact_type,
    btrim(contact.item ->> 'value'),
    nullif(btrim(contact.item ->> 'label'), ''),
    coalesce(
      (contact.item ->> 'is_primary')::boolean,
      false
    ),
    coalesce(
      nullif(contact.item ->> 'display_order', '')::integer,
      (contact.position - 1)::integer
    )
  from jsonb_array_elements(contacts_payload)
       with ordinality as contact(item, position);

  delete from public.business_hours
  where listing_id = saved_listing_id;

  if selected_type = 'comercio'::public.listing_type then
    insert into public.business_hours (
      listing_id,
      day_of_week,
      is_open,
      is_24_hours,
      open_time,
      close_time
    )
    select
      saved_listing_id,
      (hour.item ->> 'day_of_week')::smallint,
      coalesce((hour.item ->> 'is_open')::boolean, false),
      coalesce((hour.item ->> 'is_24_hours')::boolean, false),
      case
        when coalesce((hour.item ->> 'is_open')::boolean, false)
         and not coalesce(
           (hour.item ->> 'is_24_hours')::boolean,
           false
         )
        then nullif(hour.item ->> 'open_time', '')::time
        else null
      end,
      case
        when coalesce((hour.item ->> 'is_open')::boolean, false)
         and not coalesce(
           (hour.item ->> 'is_24_hours')::boolean,
           false
         )
        then nullif(hour.item ->> 'close_time', '')::time
        else null
      end
    from jsonb_array_elements(hours_payload) as hour(item);
  end if;

  delete from public.listing_payment_methods
  where listing_id = saved_listing_id;

  insert into public.listing_payment_methods (
    listing_id,
    method
  )
  select distinct
    saved_listing_id,
    (payment.value #>> '{}')::public.payment_method
  from jsonb_array_elements(payments_payload) as payment(value);

  delete from public.listing_social_links
  where listing_id = saved_listing_id;

  insert into public.listing_social_links (
    listing_id,
    network,
    url,
    display_order
  )
  select
    saved_listing_id,
    (social.item ->> 'network')::public.social_network,
    btrim(social.item ->> 'url'),
    coalesce(
      nullif(social.item ->> 'display_order', '')::integer,
      (social.position - 1)::integer
    )
  from jsonb_array_elements(socials_payload)
       with ordinality as social(item, position);

  return saved_listing_id;
end;
$function$;

alter function public.save_listing_draft(uuid, jsonb)
owner to postgres;

revoke all
on function public.save_listing_draft(uuid, jsonb)
from public;

revoke all
on function public.save_listing_draft(uuid, jsonb)
from anon, authenticated, service_role;

grant execute
on function public.save_listing_draft(uuid, jsonb)
to authenticated;

comment on function public.save_listing_draft(uuid, jsonb) is
'Guarda atómicamente una instantánea completa del formulario en estado editable. No admite actualizaciones parciales.';

commit;
