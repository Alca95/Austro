begin;

create or replace function public.can_edit_listing(
  target_listing_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.listings
    where id = target_listing_id
      and (
        public.is_admin()
        or (
          owner_id = (select auth.uid())
          and status in ('draft', 'rejected')
        )
      )
  );
$function$;

create or replace function public.can_edit_listing_path(
  target_listing_id text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.listings
    where id::text = target_listing_id
      and (
        public.is_admin()
        or (
          owner_id = (select auth.uid())
          and status in ('draft', 'rejected')
        )
      )
  );
$function$;

create or replace function public.can_read_listing(
  target_listing_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.listings
    where id = target_listing_id
      and (
        status = 'published'
        or owner_id = (select auth.uid())
        or public.has_permission('listings.view_all')
      )
  );
$function$;

create or replace function public.can_read_listing_path(
  target_listing_id text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.listings
    where id::text = target_listing_id
      and (
        status = 'published'
        or owner_id = (select auth.uid())
        or public.has_permission('listings.view_all')
      )
  );
$function$;

-- Los campos internos no pueden alterarse mediante escritura directa
-- de un propietario. Admin y superadmin conservan su operación actual.
create or replace function public.guard_listing_system_fields()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.owner_id := auth.uid();
    new.status := 'draft';
    new.city := 'Coronel Oviedo';
    new.slug := null;
    new.rejection_reason := null;
    new.published_at := null;
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
  new.created_at := old.created_at;

  return new;
end;
$function$;

drop trigger if exists listings_guard_system_fields_before
on public.listings;

create trigger listings_guard_system_fields_before
before insert or update
on public.listings
for each row
execute function public.guard_listing_system_fields();

drop policy if exists listings_owner_insert
on public.listings;

create policy listings_owner_insert
on public.listings
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and status = 'draft'::public.listing_status
);

drop policy if exists listings_owner_update
on public.listings;

create policy listings_owner_update
on public.listings
for update
to authenticated
using (
  owner_id = (select auth.uid())
  and status in (
    'draft'::public.listing_status,
    'rejected'::public.listing_status
  )
)
with check (
  owner_id = (select auth.uid())
  and status in (
    'draft'::public.listing_status,
    'rejected'::public.listing_status
  )
);

-- Support, moderator y admin pueden consultar la cola según RBAC.
drop policy if exists listings_staff_read
on public.listings;

create policy listings_staff_read
on public.listings
for select
to authenticated
using (
  public.has_permission('listings.view_all')
);

drop policy if exists listing_status_history_staff_read
on public.listing_status_history;

create policy listing_status_history_staff_read
on public.listing_status_history
for select
to authenticated
using (
  public.has_permission('listings.view_all')
);

-- El propietario no puede declarar quién verificó su documento.
revoke insert (document_verifier)
on public.listing_verifications
from authenticated;

revoke update (document_verifier)
on public.listing_verifications
from authenticated;

-- Elimina cualquier concesión anterior y expone únicamente
-- las funciones requeridas por las políticas.

revoke all
on function public.can_edit_listing(uuid)
from public;

revoke all
on function public.can_edit_listing(uuid)
from anon, authenticated;

grant execute
on function public.can_edit_listing(uuid)
to authenticated;


revoke all
on function public.can_edit_listing_path(text)
from public;

revoke all
on function public.can_edit_listing_path(text)
from anon, authenticated;

grant execute
on function public.can_edit_listing_path(text)
to authenticated;


revoke all
on function public.can_read_listing(uuid)
from public;

revoke all
on function public.can_read_listing(uuid)
from anon, authenticated;

grant execute
on function public.can_read_listing(uuid)
to anon, authenticated;


revoke all
on function public.can_read_listing_path(text)
from public;

revoke all
on function public.can_read_listing_path(text)
from anon, authenticated;

grant execute
on function public.can_read_listing_path(text)
to anon, authenticated;
commit;