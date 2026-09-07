begin;

-- Permisos específicos para información de verificación.
insert into public.permissions (code, description)
values
  (
    'verifications.view',
    'Consultar comprobaciones de identidad, RUC y credenciales.'
  ),
  (
    'verifications.review',
    'Resolver comprobaciones de identidad, RUC y credenciales.'
  )
on conflict (code) do nothing;

-- Administración recibe estos permisos.
-- Superadmin ya dispone de acceso mediante has_permission().
insert into public.role_permissions (role, permission_code)
values
  ('admin'::public.app_role, 'verifications.view'),
  ('admin'::public.app_role, 'verifications.review')
on conflict (role, permission_code) do nothing;


-- Una fila representa la comprobación actual de un requisito.
-- No almacena fotos, números de CI ni respuestas completas
-- de proveedores externos.
create table public.verification_checks (
  id uuid primary key default gen_random_uuid(),

  subject_user_id uuid not null
    references auth.users(id) on delete cascade,

  listing_id uuid
    references public.listings(id) on delete cascade,

  kind text not null
    constraint verification_checks_kind_check
    check (
      kind in (
        'contact_phone',
        'identity',
        'tax_registration',
        'professional_registration'
      )
    ),

  status text not null default 'pending'
    constraint verification_checks_status_check
    check (
      status in (
        'pending',
        'processing',
        'verified',
        'needs_correction',
        'rejected',
        'expired'
      )
    ),

  -- Se incrementará cuando cambien los datos presentados.
  -- Permite descartar resultados de revisiones antiguas.
  revision integer not null default 1
    constraint verification_checks_revision_check
    check (revision > 0),

  source text
    constraint verification_checks_source_check
    check (
      source is null
      or source in (
        'contact_challenge',
        'dnit',
        'turuc',
        'mspbs',
        'identity_provider',
        'manual'
      )
    ),

  reviewed_by uuid
    references auth.users(id) on delete set null,

  -- Mensaje apto para mostrar al propietario.
  -- Las notas internas irán en auditoría.
  owner_message text
    constraint verification_checks_message_length
    check (
      owner_message is null
      or char_length(owner_message) <= 1000
    ),

  checked_at timestamptz,
  expires_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint verification_checks_scope_check
    check (
      (
        kind in ('contact_phone', 'identity')
        and listing_id is null
      )
      or
      (
        kind in (
          'tax_registration',
          'professional_registration'
        )
        and listing_id is not null
      )
    ),

  constraint verification_checks_verified_evidence_check
    check (
      status <> 'verified'
      or (
        source is not null
        and checked_at is not null
      )
    ),

  constraint verification_checks_expiration_check
    check (
      expires_at is null
      or (
        checked_at is not null
        and expires_at > checked_at
      )
    ),

  constraint verification_checks_no_self_review
    check (
      reviewed_by is null
      or reviewed_by <> subject_user_id
    )
);

-- Identidad y teléfono se comprueban por usuario.
create unique index verification_checks_user_kind_uidx
on public.verification_checks (subject_user_id, kind)
where listing_id is null;

-- RUC y registro profesional se vinculan a la publicación.
create unique index verification_checks_listing_kind_uidx
on public.verification_checks (listing_id, kind)
where listing_id is not null;

create index verification_checks_subject_idx
on public.verification_checks (subject_user_id);

create index verification_checks_queue_idx
on public.verification_checks (status, created_at)
where status in ('pending', 'processing', 'needs_correction');

create trigger verification_checks_set_updated_at
before update on public.verification_checks
for each row
execute function public.set_updated_at();


-- Acceso privado.
alter table public.verification_checks enable row level security;

revoke all on table public.verification_checks
from public, anon, authenticated;

grant select on table public.verification_checks
to authenticated;

create policy verification_checks_owner_read
on public.verification_checks
for select
to authenticated
using (
  subject_user_id = (select auth.uid())
);

create policy verification_checks_staff_read
on public.verification_checks
for select
to authenticated
using (
  public.has_permission('verifications.view')
);

comment on table public.verification_checks is
'Estado independiente de las comprobaciones. No modifica automáticamente la visibilidad de publicaciones.';

comment on column public.verification_checks.revision is
'Versión de los datos sometidos a comprobación; los resultados deben corresponder a esta versión.';

comment on column public.verification_checks.owner_message is
'Explicación visible al titular; no incluir notas internas ni datos documentales sensibles.';

commit;