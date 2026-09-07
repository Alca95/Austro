begin;

create or replace function public.review_verification_check(
  target_check_id uuid,
  expected_revision integer,
  decision text,
  review_reason text,
  valid_until timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := auth.uid();
  current_check public.verification_checks%rowtype;
  clean_reason text := btrim(review_reason);
  previous_status text;
begin
  -- Autorización antes de consultar información privada.
  if actor_id is null then
    raise exception using
      errcode = '42501',
      message = 'Debes iniciar sesión.';
  end if;

  if public.has_permission('verifications.review') is not true then
    raise exception using
      errcode = '42501',
      message = 'No tienes permiso para resolver verificaciones.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = actor_id
      and is_active
  ) then
    raise exception using
      errcode = '42501',
      message = 'Tu cuenta no está habilitada para esta operación.';
  end if;

  -- La protección MFA también se exige en la base de datos.
  if (auth.jwt() ->> 'aal') is distinct from 'aal2' then
    raise exception using
      errcode = '42501',
      message = 'Completa la autenticación de dos factores.';
  end if;

  if decision is null
     or decision not in (
       'verified',
       'needs_correction',
       'rejected'
     ) then
    raise exception using
      errcode = '22023',
      message = 'El resultado de revisión no es válido.';
  end if;

  if clean_reason is null
     or char_length(clean_reason) not between 10 and 1000 then
    raise exception using
      errcode = '22023',
      message = 'Escribe un motivo de entre 10 y 1000 caracteres.';
  end if;

  if expected_revision is null or expected_revision < 1 then
    raise exception using
      errcode = '22023',
      message = 'Debes indicar la versión revisada.';
  end if;

  if valid_until is not null
     and (
       decision <> 'verified'
       or valid_until <= now()
     ) then
    raise exception using
      errcode = '22023',
      message = 'La vigencia debe ser futura y solo corresponde a una aprobación.';
  end if;

  select *
  into current_check
  from public.verification_checks
  where id = target_check_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'La comprobación no está disponible.';
  end if;

  if current_check.subject_user_id = actor_id then
    raise exception using
      errcode = '42501',
      message = 'No puedes revisar tus propias comprobaciones.';
  end if;

  -- Protección adicional para comprobaciones de publicaciones.
  if current_check.listing_id is not null
     and exists (
       select 1
       from public.listings
       where id = current_check.listing_id
         and owner_id = actor_id
     ) then
    raise exception using
      errcode = '42501',
      message = 'No puedes revisar comprobaciones de tus publicaciones.';
  end if;

  if current_check.revision <> expected_revision then
    raise exception using
      errcode = '22023',
      message = 'Los datos cambiaron. Actualiza la revisión antes de continuar.';
  end if;

    if current_check.status not in (
    'pending',
    'processing'
    ) then
    raise exception using
      errcode = '22023',
      message = 'Esta comprobación ya fue resuelta o requiere un nuevo envío.';
  end if;

  -- El teléfono se confirma mediante un código, no manualmente.
  if current_check.kind = 'contact_phone' then
    raise exception using
      errcode = '22023',
      message = 'El teléfono debe confirmarse mediante el flujo de código de verificación.';
  end if;

  previous_status := current_check.status;

  update public.verification_checks
  set
    status = decision,
    source = 'manual',
    reviewed_by = actor_id,
    owner_message = clean_reason,
    checked_at = now(),
    expires_at = valid_until
  where id = current_check.id;

  -- Auditoría y decisión se guardan en la misma transacción.
  -- Si falla la auditoría, tampoco se guarda la decisión.
  insert into public.admin_audit_log (
    actor_id,
    action,
    target_type,
    target_id,
    reason,
    metadata
  )
  values (
    actor_id,
    'verification.review',
    'verification_check',
    current_check.id::text,
    clean_reason,
    jsonb_build_object(
      'kind', current_check.kind,
      'previous_status', previous_status,
      'new_status', decision,
      'revision', current_check.revision,
      'source', 'manual',
      'expires_at', valid_until
    )
  );
end;
$function$;

alter function public.review_verification_check(
  uuid, integer, text, text, timestamptz
) owner to postgres;

revoke all on function public.review_verification_check(
  uuid, integer, text, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.review_verification_check(
  uuid, integer, text, text, timestamptz
) to authenticated;

commit;