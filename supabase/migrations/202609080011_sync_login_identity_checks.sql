begin;

-- =========================================================
-- 1. ACLARAR LA FUENTE CANÓNICA DE LOS ESTADOS
-- =========================================================

comment on column private.user_login_identities.verification_status is
'Estado heredado de la identidad de acceso. El flujo administrativo de comprobación utiliza public.verification_checks.';

comment on column private.user_login_identities.ci_hmac is
'HMAC-SHA-256 de la CI calculado exclusivamente en servidor. Nunca contiene la CI completa.';

comment on column private.user_login_identities.ci_last4 is
'Últimos cuatro dígitos para identificación enmascarada en procesos autorizados.';


-- =========================================================
-- 2. SINCRONIZAR IDENTIDAD DE ACCESO CON VERIFICATION_CHECKS
-- =========================================================

create or replace function private.sync_login_identity_check()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
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
    new.user_id,
    null,
    'identity',
    'pending',
    1,
    null,
    null,
    null,
    null,
    null,
    btrim(new.ci_hmac::text)
  )
  on conflict (subject_user_id, kind)
  where listing_id is null
  do update set
    status = 'pending',
    revision = public.verification_checks.revision + 1,
    source = null,
    reviewed_by = null,
    owner_message = null,
    checked_at = null,
    expires_at = null,
    evidence_fingerprint = excluded.evidence_fingerprint
  where public.verification_checks.evidence_fingerprint
        is distinct from excluded.evidence_fingerprint;

  return new;
end;
$function$;

alter function private.sync_login_identity_check()
  owner to postgres;

revoke all
on function private.sync_login_identity_check()
from public, anon, authenticated, service_role;

drop trigger if exists user_login_identities_sync_check
on private.user_login_identities;

create trigger user_login_identities_sync_check
after insert or update of ci_hmac
on private.user_login_identities
for each row
execute function private.sync_login_identity_check();


-- =========================================================
-- 3. INCORPORAR IDENTIDADES YA EXISTENTES
-- =========================================================

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
select
  uli.user_id,
  null,
  'identity',
  'pending',
  1,
  null,
  null,
  null,
  null,
  null,
  btrim(uli.ci_hmac::text)
from private.user_login_identities uli
on conflict (subject_user_id, kind)
where listing_id is null
do update set
  status = 'pending',
  revision = public.verification_checks.revision + 1,
  source = null,
  reviewed_by = null,
  owner_message = null,
  checked_at = null,
  expires_at = null,
  evidence_fingerprint = excluded.evidence_fingerprint
where public.verification_checks.evidence_fingerprint
      is distinct from excluded.evidence_fingerprint;


-- =========================================================
-- 4. DOCUMENTACIÓN DE PRIVACIDAD
-- =========================================================

comment on function private.sync_login_identity_check() is
'Crea una comprobación de identidad pendiente sin copiar la CI completa. Solo reinicia la comprobación si cambia el HMAC canónico.';

commit;