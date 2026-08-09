export type ListingType = "comercio" | "servicio" | "evento";

export type ListingCategory =
  | "gastronomia"
  | "salud"
  | "belleza"
  | "hogar"
  | "educacion"
  | "entretenimiento";

export type AustroListing = {
  id: string;
  name: string;
  type: ListingType;
  category: ListingCategory;
  categoryLabel: string;
  description: string;
  neighborhood: string;
  distanceKm: number;
  rating: number;
  reviews: number;
  verified: boolean;
  status: string;
  accent: "blue" | "violet" | "cyan" | "rose" | "emerald" | "amber";
  eventDate?: string;
};

export const listingTypeLabels: Record<ListingType, string> = {
  comercio: "Comercio",
  servicio: "Servicio",
  evento: "Evento",
};

export const categoryOptions: Array<{
  value: ListingCategory;
  label: string;
}> = [
  { value: "gastronomia", label: "Gastronomía" },
  { value: "salud", label: "Salud" },
  { value: "belleza", label: "Belleza" },
  { value: "hogar", label: "Hogar" },
  { value: "educacion", label: "Educación" },
  { value: "entretenimiento", label: "Entretenimiento" },
];

export const austroListings: AustroListing[] = [
  {
    id: "sabores-de-oviedo",
    name: "Sabores de Oviedo",
    type: "comercio",
    category: "gastronomia",
    categoryLabel: "Gastronomía",
    description:
      "Cocina local, almuerzos ejecutivos y opciones para compartir.",
    neighborhood: "Centro",
    distanceKm: 1.2,
    rating: 4.8,
    reviews: 126,
    verified: true,
    status: "Abierto ahora",
    accent: "blue",
  },
  {
    id: "soluciones-del-hogar",
    name: "Soluciones del Hogar",
    type: "servicio",
    category: "hogar",
    categoryLabel: "Electricidad y reparaciones",
    description:
      "Instalaciones, mantenimiento eléctrico y reparaciones a domicilio.",
    neighborhood: "San Isidro",
    distanceKm: 2.4,
    rating: 4.9,
    reviews: 89,
    verified: true,
    status: "Disponible hoy",
    accent: "violet",
  },
  {
    id: "feria-local-emprendedores",
    name: "Feria Local de Emprendedores",
    type: "evento",
    category: "entretenimiento",
    categoryLabel: "Cultura y comunidad",
    description:
      "Productos locales, gastronomía, música y actividades familiares.",
    neighborhood: "Plaza de los Héroes",
    distanceKm: 0.8,
    rating: 4.7,
    reviews: 54,
    verified: false,
    status: "17:00",
    accent: "cyan",
    eventDate: "SÁB 08",
  },
  {
    id: "clinica-bienestar",
    name: "Clínica Bienestar",
    type: "servicio",
    category: "salud",
    categoryLabel: "Salud",
    description: "Consultas generales y atención preventiva con agenda previa.",
    neighborhood: "Azucena",
    distanceKm: 3.1,
    rating: 4.8,
    reviews: 73,
    verified: true,
    status: "Turnos disponibles",
    accent: "rose",
  },
  {
    id: "casa-verde",
    name: "Casa Verde",
    type: "comercio",
    category: "hogar",
    categoryLabel: "Hogar y decoración",
    description:
      "Artículos para el hogar, decoración y regalos con identidad local.",
    neighborhood: "12 de Junio",
    distanceKm: 1.9,
    rating: 4.6,
    reviews: 61,
    verified: true,
    status: "Abierto hasta las 19:00",
    accent: "emerald",
  },
  {
    id: "estudio-luz",
    name: "Estudio Luz",
    type: "servicio",
    category: "belleza",
    categoryLabel: "Belleza",
    description:
      "Peluquería, estética y cuidado personal con reserva anticipada.",
    neighborhood: "Centro",
    distanceKm: 1.4,
    rating: 4.9,
    reviews: 112,
    verified: true,
    status: "Agenda abierta",
    accent: "violet",
  },
  {
    id: "aula-norte",
    name: "Aula Norte",
    type: "servicio",
    category: "educacion",
    categoryLabel: "Educación",
    description: "Clases de apoyo, idiomas y preparación para exámenes.",
    neighborhood: "Capitán Roa",
    distanceKm: 2.7,
    rating: 4.7,
    reviews: 48,
    verified: true,
    status: "Inscripciones abiertas",
    accent: "blue",
  },
  {
    id: "noche-cultural-ovetense",
    name: "Noche Cultural Ovetense",
    type: "evento",
    category: "entretenimiento",
    categoryLabel: "Arte y música",
    description:
      "Presentaciones artísticas y música en vivo para toda la comunidad.",
    neighborhood: "Centro Cultural",
    distanceKm: 1.6,
    rating: 4.8,
    reviews: 37,
    verified: false,
    status: "19:30",
    accent: "amber",
    eventDate: "VIE 14",
  },
];
