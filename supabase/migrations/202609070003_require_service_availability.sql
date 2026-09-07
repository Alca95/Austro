begin;

alter table public.service_details
  alter column availability_notes set not null;

alter table public.service_details
  add constraint service_details_availability_notes_length
  check (
    char_length(btrim(availability_notes))
    between 3 and 300
  );

comment on column public.service_details.availability_notes is
'Descripción obligatoria de disponibilidad, entre 3 y 300 caracteres.';

commit;