begin;

-- =========================================================
-- 1. HUELLA DE LA EVIDENCIA PRESENTADA
-- =========================================================

alter table public.verification_checks
  add column if not exists evidence_fingerprint text;

alter table public.verification_checks
  drop constraint if exists verification_checks_fingerprint_check;

alter table public.verification_checks
  add constraint verification_checks_fingerprint_check
  check (
    evidence_fingerprint is null
    or evidence_fingerprint ~ '^[0-9a-f]{64}$'
  );

comment on column public.verification_checks.evidence_fingerprint is
'Huella SHA-256 interna para detectar cambios. No sustituye la validación con una fuente externa.';

-- El propietario puede consultar el resultado, pero no la huella interna.
-- Un REVOKE por columna no bastaría mientras exista SELECT de tabla.
revoke select
on table public.verification_checks
from authenticated;

grant select (
  id,
  subject_user_id,
  listing_id,
  kind,
  status,
  revision,
  source,
  reviewed_by,
  owner_message,
  checked_at,
  expires_at,
  created_at,
  updated_at
)
on public.verification_checks
to authenticated;

comment on column public.verification_checks.revision is
'Versión del envío revisado. Aumenta cuando cambian los datos o se reinicia una comprobación vencida.';


-- =========================================================
-- 2. RUC OPCIONAL PARA COMERCIOS Y SERVICIOS
-- =========================================================

drop trigger if exists listing_verifications_enforce_type
on public.listing_verifications;

create or replace function public.enforce_tax_registration_subtype()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  actual_type public.listing_type;
begin
  select type
  into actual_type
  from public.listings
  where id = new.listing_id;

  if actual_type is null then
    raise exception using
      errcode = '23503',
      message = 'La publicación no existe.';
  end if;

  if actual_type not in (
    'comercio'::public.listing_type,
    'servicio'::public.listing_type
  ) then
    raise exception using
      errcode = '23514',
      message = 'El RUC solo corresponde a comercios o servicios.';
  end if;

  return new;
end;
$function$;

alter function public.enforce_tax_registration_subtype()
  owner to postgres;

revoke all
on function public.enforce_tax_registration_subtype()
from public, anon, authenticated;

create trigger listing_verifications_enforce_type
before insert or update
on public.listing_verifications
for each row
execute function public.enforce_tax_registration_subtype();

alter table public.listing_verifications
  drop constraint if exists listing_verifications_ruc_only;

alter table public.listing_verifications
  add constraint listing_verifications_ruc_only
  check (
    document_type = 'ruc'::public.document_type
  );

comment on table public.listing_verifications is
'Datos privados del RUC opcional presentado para una publicación de comercio o servicio.';


-- =========================================================
-- 3. TODA MODIFICACIÓN PASA POR LA RPC SEGURA
-- =========================================================

-- Quita cualquier privilegio amplio conocido.
revoke all privileges
on table public.listing_verifications
from public, anon, authenticated;

-- Los privilegios por columna se acumulan con los de tabla,
-- por eso se revocan expresamente todas las columnas escribibles.
revoke insert (
  listing_id,
  document_type,
  document_number,
  verification_digit,
  status,
  verified_at,
  created_at,
  updated_at
)
on public.listing_verifications
from public, anon, authenticated;

revoke update (
  listing_id,
  document_type,
  document_number,
  verification_digit,
  status,
  verified_at,
  created_at,
  updated_at
)
on public.listing_verifications
from public, anon, authenticated;

-- La lectura continúa protegida por las políticas RLS existentes.
grant select
on table public.listing_verifications
to authenticated;


-- =========================================================
-- 4. SINCRONIZACIÓN CON EL ESTADO LEGACY
-- =========================================================

create or replace function public.sync_tax_verification_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.kind = 'tax_registration'
     and new.listing_id is not null then

    update public.listing_verifications
    set
      status = case
        when new.status = 'verified'
          then 'verified'::public.verification_status
        when new.status in ('needs_correction', 'rejected')
          then 'rejected'::public.verification_status
        else 'pending'::public.verification_status
      end,

      verified_at = case
        when new.status = 'verified'
          then new.checked_at
        else null
      end
    where listing_id = new.listing_id;
  end if;

  return new;
end;
$function$;

alter function public.sync_tax_verification_status()
  owner to postgres;

revoke all
on function public.sync_tax_verification_status()
from public, anon, authenticated;

drop trigger if exists verification_checks_sync_tax_status
on public.verification_checks;

create trigger verification_checks_sync_tax_status
after insert or update of status, checked_at
on public.verification_checks
for each row
execute function public.sync_tax_verification_status();


-- =========================================================
-- 5. PRESENTACIÓN O CORRECCIÓN DEL RUC
-- =========================================================

create or replace function public.submit_tax_verification(
  target_listing_id uuid,
  target_ruc_number text,
  target_verification_digit text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := auth.uid();
  target_listing public.listings%rowtype;
  current_check public.verification_checks%rowtype;

  clean_ruc_number text := btrim(target_ruc_number);
  clean_verification_digit text :=
    btrim(target_verification_digit);

  calculated_fingerprint text;
  resulting_check_id uuid;
begin
  if actor_id is null then
    raise exception using
      errcode = '42501',
      message = 'Debes iniciar sesión.';
  end if;

  select *
  into target_listing
  from public.listings
  where id = target_listing_id
    and owner_id = actor_id
    and type in (
      'comercio'::public.listing_type,
      'servicio'::public.listing_type
    )
    and status <> 'archived'::public.listing_status
  for update;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'La publicación no está disponible o no tienes permiso.';
  end if;

  if clean_ruc_number is null
     or clean_ruc_number !~ '^[0-9]{4,10}$' then
    raise exception using
      errcode = '22023',
      message = 'El RUC debe contener entre 4 y 10 dígitos.';
  end if;

  if clean_verification_digit is null
     or clean_verification_digit !~ '^[0-9]$' then
    raise exception using
      errcode = '22023',
      message = 'El dígito verificador debe contener un solo número.';
  end if;

  calculated_fingerprint := encode(
    extensions.digest(
      pg_catalog.convert_to(
        'ruc:v1:'
          || clean_ruc_number
          || ':'
          || clean_verification_digit,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  select *
  into current_check
  from public.verification_checks
  where listing_id = target_listing.id
    and kind = 'tax_registration'
  for update;

  if found
     and current_check.evidence_fingerprint =
         calculated_fingerprint then

    -- Repetir una solicitud en curso es una operación idempotente.
    if current_check.status in (
      'pending',
      'processing',
      'verified'
    ) then
      return current_check.id;
    end if;

    -- Una corrección debe contener datos diferentes.
    if current_check.status in (
      'needs_correction',
      'rejected'
    ) then
      raise exception using
        errcode = '22023',
        message = 'Debes corregir el RUC o su dígito verificador antes de reenviarlo.';
    end if;

    -- Una comprobación vencida puede reiniciarse aun si el dato no cambió.
    if current_check.status = 'expired' then
      insert into public.listing_verifications (
        listing_id,
        document_type,
        document_number,
        verification_digit,
        status,
        verified_at
      )
      values (
        target_listing.id,
        'ruc'::public.document_type,
        clean_ruc_number,
        clean_verification_digit,
        'pending'::public.verification_status,
        null
      )
      on conflict (listing_id)
      do update set
        document_type = excluded.document_type,
        document_number = excluded.document_number,
        verification_digit = excluded.verification_digit,
        status = excluded.status,
        verified_at = null;

      update public.verification_checks
      set
        status = 'pending',
        revision = revision + 1,
        source = null,
        reviewed_by = null,
        owner_message = null,
        checked_at = null,
        expires_at = null
      where id = current_check.id;

      return current_check.id;
    end if;
  end if;

  -- Datos nuevos o corregidos.
  insert into public.listing_verifications (
    listing_id,
    document_type,
    document_number,
    verification_digit,
    status,
    verified_at
  )
  values (
    target_listing.id,
    'ruc'::public.document_type,
    clean_ruc_number,
    clean_verification_digit,
    'pending'::public.verification_status,
    null
  )
  on conflict (listing_id)
  do update set
    document_type = excluded.document_type,
    document_number = excluded.document_number,
    verification_digit = excluded.verification_digit,
    status = excluded.status,
    verified_at = null;

  if current_check.id is null then
    insert into public.verification_checks (
      subject_user_id,
      listing_id,
      kind,
      status,
      revision,
      source,
      reviewed_by,
      owner_message,
      checked_at,
      expires_at,
      evidence_fingerprint
    )
    values (
      actor_id,
      target_listing.id,
      'tax_registration',
      'pending',
      1,
      null,
      null,
      null,
      null,
      null,
      calculated_fingerprint
    )
    returning id into resulting_check_id;
  else
    update public.verification_checks
    set
      status = 'pending',
      revision = revision + 1,
      source = null,
      reviewed_by = null,
      owner_message = null,
      checked_at = null,
      expires_at = null,
      evidence_fingerprint = calculated_fingerprint
    where id = current_check.id
    returning id into resulting_check_id;
  end if;

  return resulting_check_id;
end;
$function$;

alter function public.submit_tax_verification(
  uuid, text, text
) owner to postgres;

revoke all
on function public.submit_tax_verification(
  uuid, text, text
)
from public, anon, authenticated;

grant execute
on function public.submit_tax_verification(
  uuid, text, text
)
to authenticated;

commit;