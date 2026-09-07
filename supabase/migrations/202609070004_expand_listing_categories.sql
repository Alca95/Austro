begin;

alter table public.categories
  add column allowed_types public.listing_type[];

update public.categories
set allowed_types = case slug
  when 'gastronomia'
    then array['comercio', 'servicio', 'evento']::public.listing_type[]
  when 'salud'
    then array['comercio', 'servicio', 'evento']::public.listing_type[]
  when 'belleza'
    then array['comercio', 'servicio']::public.listing_type[]
  when 'hogar'
    then array['comercio', 'servicio']::public.listing_type[]
  when 'educacion'
    then array['comercio', 'servicio', 'evento']::public.listing_type[]
  when 'entretenimiento'
    then array['comercio', 'servicio', 'evento']::public.listing_type[]
  else array['comercio', 'servicio', 'evento']::public.listing_type[]
end;

insert into public.categories (
  name,
  slug,
  is_active,
  display_order,
  allowed_types
)
values
  (
    'Supermercados y despensas',
    'supermercados-despensas',
    true,
    70,
    array['comercio']::public.listing_type[]
  ),
  (
    'Panaderías y confiterías',
    'panaderias-confiterias',
    true,
    80,
    array['comercio', 'servicio']::public.listing_type[]
  ),
  (
    'Moda y calzado',
    'moda-calzado',
    true,
    90,
    array['comercio', 'servicio']::public.listing_type[]
  ),
  (
    'Farmacias',
    'farmacias',
    true,
    100,
    array['comercio']::public.listing_type[]
  ),
  (
    'Ferretería y construcción',
    'ferreteria-construccion',
    true,
    110,
    array['comercio', 'servicio']::public.listing_type[]
  ),
  (
    'Tecnología y electrónica',
    'tecnologia-electronica',
    true,
    120,
    array['comercio', 'servicio', 'evento']::public.listing_type[]
  ),
  (
    'Telefonía y comunicaciones',
    'telefonia-comunicaciones',
    true,
    130,
    array['comercio', 'servicio']::public.listing_type[]
  ),
  (
    'Automotores y repuestos',
    'automotores-repuestos',
    true,
    140,
    array['comercio', 'servicio', 'evento']::public.listing_type[]
  ),
  (
    'Librería y oficina',
    'libreria-oficina',
    true,
    150,
    array['comercio']::public.listing_type[]
  ),
  (
    'Agropecuaria',
    'agropecuaria',
    true,
    160,
    array['comercio', 'servicio', 'evento']::public.listing_type[]
  ),
  (
    'Mascotas y veterinaria',
    'mascotas-veterinaria',
    true,
    170,
    array['comercio', 'servicio', 'evento']::public.listing_type[]
  ),
  (
    'Deportes y actividad física',
    'deportes-actividad-fisica',
    true,
    180,
    array['comercio', 'servicio', 'evento']::public.listing_type[]
  ),
  (
    'Turismo y alojamiento',
    'turismo-alojamiento',
    true,
    190,
    array['comercio', 'servicio', 'evento']::public.listing_type[]
  ),
  (
    'Inmuebles',
    'inmuebles',
    true,
    200,
    array['comercio', 'servicio']::public.listing_type[]
  ),
  (
    'Profesionales y consultoría',
    'profesionales-consultoria',
    true,
    210,
    array['servicio', 'evento']::public.listing_type[]
  ),
  (
    'Servicios técnicos y reparaciones',
    'servicios-tecnicos-reparaciones',
    true,
    220,
    array['servicio']::public.listing_type[]
  ),
  (
    'Limpieza y mantenimiento',
    'limpieza-mantenimiento',
    true,
    230,
    array['servicio']::public.listing_type[]
  ),
  (
    'Transporte y movilidad',
    'transporte-movilidad',
    true,
    240,
    array['servicio']::public.listing_type[]
  ),
  (
    'Encomiendas y logística',
    'encomiendas-logistica',
    true,
    250,
    array['servicio']::public.listing_type[]
  ),
  (
    'Servicios financieros y seguros',
    'servicios-financieros-seguros',
    true,
    260,
    array['servicio']::public.listing_type[]
  ),
  (
    'Servicios legales y contables',
    'servicios-legales-contables',
    true,
    270,
    array['servicio']::public.listing_type[]
  ),
  (
    'Diseño, publicidad e impresión',
    'diseno-publicidad-impresion',
    true,
    280,
    array['comercio', 'servicio', 'evento']::public.listing_type[]
  ),
  (
    'Fotografía y producción audiovisual',
    'fotografia-produccion-audiovisual',
    true,
    290,
    array['comercio', 'servicio', 'evento']::public.listing_type[]
  ),
  (
    'Organización de eventos',
    'organizacion-eventos',
    true,
    300,
    array['servicio', 'evento']::public.listing_type[]
  ),
  (
    'Música y espectáculos',
    'musica-espectaculos',
    true,
    310,
    array['servicio', 'evento']::public.listing_type[]
  ),
  (
    'Cultura y arte',
    'cultura-arte',
    true,
    320,
    array['comercio', 'servicio', 'evento']::public.listing_type[]
  ),
  (
    'Ferias y exposiciones',
    'ferias-exposiciones',
    true,
    330,
    array['evento']::public.listing_type[]
  ),
  (
    'Negocios y emprendimiento',
    'negocios-emprendimiento',
    true,
    340,
    array['servicio', 'evento']::public.listing_type[]
  ),
  (
    'Comunidad y solidaridad',
    'comunidad-solidaridad',
    true,
    350,
    array['servicio', 'evento']::public.listing_type[]
  ),
  (
    'Infancia y familia',
    'infancia-familia',
    true,
    360,
    array['comercio', 'servicio', 'evento']::public.listing_type[]
  ),
  (
    'Actividades religiosas',
    'actividades-religiosas',
    true,
    370,
    array['evento']::public.listing_type[]
  ),
  (
    'Seguridad y vigilancia',
    'seguridad-vigilancia',
    true,
    380,
    array['comercio', 'servicio']::public.listing_type[]
  ),
  (
    'Jardinería y paisajismo',
    'jardineria-paisajismo',
    true,
    390,
    array['comercio', 'servicio']::public.listing_type[]
  ),
  (
    'Cuidado de personas',
    'cuidado-personas',
    true,
    400,
    array['servicio']::public.listing_type[]
  ),
  (
    'Lavandería y costura',
    'lavanderia-costura',
    true,
    410,
    array['servicio']::public.listing_type[]
  ),
  (
    'Industria y producción',
    'industria-produccion',
    true,
    420,
    array['comercio', 'servicio', 'evento']::public.listing_type[]
  ),
  (
    'Vida nocturna',
    'vida-nocturna',
    true,
    430,
    array['comercio', 'evento']::public.listing_type[]
  ),
  (
    'Otros',
    'otros',
    true,
    440,
    array['comercio', 'servicio', 'evento']::public.listing_type[]
  )
on conflict (slug) do nothing;

alter table public.categories
  alter column allowed_types set not null;

alter table public.categories
  add constraint categories_allowed_types_not_empty
  check (cardinality(allowed_types) > 0);


comment on column public.categories.allowed_types is
'Tipos de publicación compatibles con la categoría.';

commit;