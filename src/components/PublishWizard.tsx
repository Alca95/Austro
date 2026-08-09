"use client";

import { ChangeEvent, FormEvent, ReactNode, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  ImagePlus,
  Info,
  MapPin,
  Mic,
  Navigation,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { categoryOptions, ListingType } from "../data/austroListings";

type DocumentType = "" | "ruc" | "ci";

type SocialNetwork =
  | ""
  | "facebook"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "otro";

type SocialLink = {
  network: SocialNetwork;
  url: string;
};

type InvoiceStatus = "" | "yes" | "no" | "prefer_not";

type PaymentMethod =
  | "cash"
  | "transfer"
  | "debit"
  | "credit"
  | "qr"
  | "mobile"
  | "other";

type BusinessHour = {
  day: string;
  label: string;
  isOpen: boolean;
  is24Hours: boolean;
  openTime: string;
  closeTime: string;
};

type EventPricing = "" | "free" | "paid";

type FormData = {
  type: ListingType;
  name: string;
  category: string;
  description: string;
  additionalInfo: string;

  documentType: DocumentType;
  documentNumber: string;
  documentVerifier: string;

  city: string;
  address: string;
  locationReference: string;
  neighborhood: string;
  serviceArea: string;
  latitude: string;
  longitude: string;

  whatsapp: string;
  additionalContacts: string[];
  email: string;
  website: string;
  socialLinks: SocialLink[];

  invoiceStatus: InvoiceStatus;
  paymentMethods: PaymentMethod[];
  businessHours: BusinessHour[];
  delivery: boolean;
  pickup: boolean;
  reservations: boolean;
  parking: boolean;
  accessibility: boolean;
  afterHoursMessages: boolean;

  serviceAtHome: boolean;
  serviceFixedLocation: boolean;
  serviceRemote: boolean;
  requiresAppointment: boolean;
  offersQuote: boolean;
  urgentService: boolean;
  availabilityNotes: string;
  priceFrom: string;

  eventStart: string;
  eventEnd: string;
  eventPricing: EventPricing;
  ticketPrice: string;
  ticketUrl: string;
  limitedCapacity: boolean;
  recommendedAudience: string;
  ageRestriction: string;

  imageName: string;
};

type HelpMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
};

type FieldErrors = Partial<Record<keyof FormData, string>>;

const publicationTypes: Array<{
  value: ListingType;
  label: string;
  description: string;
  stepTwoTitle: string;
  stepTwoDescription: string;
  contextMessage: string;
  icon: typeof Store;
  visual: {
    selectedCard: string;
    selectedIcon: string;
    idleIcon: string;
    accentBar: string;
    accentText: string;
    contextPanel: string;
    reviewHeader: string;
  };
}> = [
  {
    value: "comercio",
    label: "Comercio",
    description: "Local, tienda, restaurante o emprendimiento con ubicación.",
    stepTwoTitle: "Ubicación y contacto del comercio",
    stepTwoDescription:
      "Indica dónde se encuentra el local y cómo pueden comunicarse los clientes.",
    contextMessage:
      "Presenta claramente el local, sus productos y la forma de llegar.",
    icon: Store,
    visual: {
      selectedCard:
        "border-emerald-300 bg-emerald-50/80 shadow-[0_10px_30px_rgba(5,150,105,0.12)]",
      selectedIcon: "bg-emerald-600 text-white",
      idleIcon: "bg-emerald-50 text-emerald-700",
      accentBar: "bg-emerald-600",
      accentText: "text-emerald-700",
      contextPanel: "border-emerald-100 bg-emerald-50/70",
      reviewHeader: "bg-emerald-50/70",
    },
  },
  {
    value: "servicio",
    label: "Servicio",
    description: "Profesional, oficio o actividad ofrecida por zona.",
    stepTwoTitle: "Cobertura y contacto profesional",
    stepTwoDescription:
      "Indica dónde prestas el servicio y cómo pueden solicitar tu trabajo.",
    contextMessage:
      "Destaca tu especialidad, forma de trabajo y área de cobertura.",
    icon: BriefcaseBusiness,
    visual: {
      selectedCard:
        "border-indigo-300 bg-indigo-50/80 shadow-[0_10px_30px_rgba(79,70,229,0.12)]",
      selectedIcon: "bg-indigo-600 text-white",
      idleIcon: "bg-indigo-50 text-indigo-700",
      accentBar: "bg-indigo-600",
      accentText: "text-indigo-700",
      contextPanel: "border-indigo-100 bg-indigo-50/70",
      reviewHeader: "bg-indigo-50/70",
    },
  },
  {
    value: "evento",
    label: "Evento",
    description: "Actividad con fecha, horario y lugar definidos.",
    stepTwoTitle: "Lugar, fecha y contacto del evento",
    stepTwoDescription:
      "Completa la información necesaria para que las personas puedan asistir.",
    contextMessage:
      "Comunica de manera visible cuándo, dónde y cómo participar.",
    icon: CalendarDays,
    visual: {
      selectedCard:
        "border-orange-300 bg-orange-50/80 shadow-[0_10px_30px_rgba(234,88,12,0.12)]",
      selectedIcon: "bg-orange-600 text-white",
      idleIcon: "bg-orange-50 text-orange-700",
      accentBar: "bg-orange-600",
      accentText: "text-orange-700",
      contextPanel: "border-orange-100 bg-orange-50/70",
      reviewHeader: "bg-orange-50/70",
    },
  },
];

const LOCAL_CITY = "Coronel Oviedo";

const initialFormData: FormData = {
  type: "comercio",
  name: "",
  category: "",
  description: "",
  additionalInfo: "",

  documentType: "",
  documentNumber: "",
  documentVerifier: "",

  city: LOCAL_CITY,
  address: "",
  locationReference: "",
  neighborhood: "",
  serviceArea: "",
  latitude: "",
  longitude: "",

  whatsapp: "",
  additionalContacts: [],
  email: "",
  website: "",
  socialLinks: [],

  invoiceStatus: "",
  paymentMethods: [],
  businessHours: [
    {
      day: "monday",
      label: "Lunes",
      isOpen: true,
      is24Hours: false,
      openTime: "08:00",
      closeTime: "18:00",
    },
    {
      day: "tuesday",
      label: "Martes",
      isOpen: true,
      is24Hours: false,
      openTime: "08:00",
      closeTime: "18:00",
    },
    {
      day: "wednesday",
      label: "Miércoles",
      isOpen: true,
      is24Hours: false,
      openTime: "08:00",
      closeTime: "18:00",
    },
    {
      day: "thursday",
      label: "Jueves",
      isOpen: true,
      is24Hours: false,
      openTime: "08:00",
      closeTime: "18:00",
    },
    {
      day: "friday",
      label: "Viernes",
      isOpen: true,
      is24Hours: false,
      openTime: "08:00",
      closeTime: "18:00",
    },
    {
      day: "saturday",
      label: "Sábado",
      isOpen: false,
      is24Hours: false,
      openTime: "08:00",
      closeTime: "12:00",
    },
    {
      day: "sunday",
      label: "Domingo",
      isOpen: false,
      is24Hours: false,
      openTime: "08:00",
      closeTime: "12:00",
    },
  ],
  delivery: false,
  pickup: false,
  reservations: false,
  parking: false,
  accessibility: false,
  afterHoursMessages: false,

  serviceAtHome: true,
  serviceFixedLocation: false,
  serviceRemote: false,
  requiresAppointment: false,
  offersQuote: false,
  urgentService: false,
  availabilityNotes: "",
  priceFrom: "",

  eventStart: "",
  eventEnd: "",
  eventPricing: "",
  ticketPrice: "",
  ticketUrl: "",
  limitedCapacity: false,
  recommendedAudience: "",
  ageRestriction: "",

  imageName: "",
};

const initialHelpMessages: HelpMessage[] = [
  {
    id: 1,
    role: "assistant",
    content:
      "Hola. Te ayudaré a completar tu publicación paso a paso. Para comenzar, ¿quieres publicar un comercio, un servicio o un evento?",
  },
];

const paymentOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: "cash", label: "Efectivo" },
  { value: "transfer", label: "Transferencia" },
  { value: "debit", label: "Débito" },
  { value: "credit", label: "Crédito" },
  { value: "qr", label: "QR" },
  { value: "mobile", label: "Giros" },
  { value: "other", label: "Otro" },
];

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground outline-none transition-shadow placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/15";

function normalizeDigits(value: string, maxLength = 10) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function yesNoLabel(value: boolean) {
  return value ? "Sí" : "No";
}

function invoiceLabel(value: InvoiceStatus) {
  if (value === "yes") return "Sí";
  if (value === "no") return "No";
  return "No informado";
}

function ReviewItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold text-text-secondary">{label}</dt>
      <dd className="mt-1 break-words text-sm font-bold text-foreground">
        {value?.trim() || "—"}
      </dd>
    </div>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border/70 p-5 first:border-t-0">
      <h4 className="text-sm font-bold text-foreground">{title}</h4>
      <dl className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-red-600">{message}</p>;
}

function AssistantLauncher({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className="group relative w-full overflow-hidden rounded-3xl border border-blue-100 bg-surface p-5 text-left shadow-[0_18px_50px_rgba(29,78,216,0.09)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_22px_55px_rgba(29,78,216,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <span
        aria-hidden="true"
        className="absolute -right-12 -top-14 h-36 w-36 rounded-full bg-primary/[0.06] transition-transform duration-500 group-hover:scale-110"
      />

      <span className="relative flex items-center gap-4">
        <span className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute inset-1 rounded-2xl bg-primary/15 motion-safe:animate-[pulse_2.8s_ease-in-out_infinite]"
          />
          <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_10px_25px_rgba(29,78,216,0.28)] transition-transform duration-300 group-hover:scale-105">
            <UserRound aria-hidden="true" className="h-6 w-6" />
          </span>
          <span className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-cyan-400 text-slate-950 shadow-sm motion-safe:animate-[pulse_2.2s_ease-in-out_infinite]">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
          </span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-primary">
            Asistente guiado
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="mt-1 block text-base font-bold text-foreground">
            Completar con ayuda
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-xs font-medium text-text-secondary transition-colors group-hover:text-primary">
            Habla o escribe
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </span>
        </span>
      </span>
    </button>
  );
}

function ToggleCard({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-soft/60">
      <span>
        <span className="block text-sm font-semibold text-foreground">
          {label}
        </span>
        {description && (
          <span className="mt-1 block text-xs leading-5 text-text-secondary">
            {description}
          </span>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-border transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
}

export default function PublishWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpInput, setHelpInput] = useState("");
  const [helpMessages, setHelpMessages] =
    useState<HelpMessage[]>(initialHelpMessages);

  const selectedType = useMemo(
    () =>
      publicationTypes.find((option) => option.value === formData.type) ??
      publicationTypes[0],
    [formData.type],
  );

  const mapEmbedUrl = useMemo(() => {
    if (!formData.latitude || !formData.longitude) return "";

    const latitude = Number(formData.latitude);
    const longitude = Number(formData.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return "";

    const offset = 0.004;
    const bbox = [
      longitude - offset,
      latitude - offset,
      longitude + offset,
      latitude + offset,
    ].join(",");

    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
      bbox,
    )}&layer=mapnik&marker=${encodeURIComponent(`${latitude},${longitude}`)}`;
  }, [formData.latitude, formData.longitude]);

  function updateField<K extends keyof FormData>(field: K, value: FormData[K]) {
    setFormData((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  function changeListingType(type: ListingType) {
    setFormData((current) => ({
      ...current,
      type,
      documentType: type === "comercio" ? current.documentType : "",
      documentNumber: type === "comercio" ? current.documentNumber : "",
      documentVerifier: type === "comercio" ? current.documentVerifier : "",
    }));
    setErrors({});
  }

  function changeDocumentType(documentType: DocumentType) {
    setFormData((current) => ({
      ...current,
      documentType,
      documentNumber: "",
      documentVerifier: "",
    }));
    setErrors((current) => ({
      ...current,
      documentType: undefined,
      documentNumber: undefined,
      documentVerifier: undefined,
    }));
  }

  function changeDocumentNumber(value: string) {
    const pastedRuc = value.match(/^([\d.\s]+)[-–—]\s*(\d)\s*$/);

    if (formData.documentType === "ruc" && pastedRuc) {
      updateField("documentNumber", normalizeDigits(pastedRuc[1], 10));
      updateField("documentVerifier", pastedRuc[2]);
      return;
    }

    updateField("documentNumber", normalizeDigits(value, 10));
  }

  function handleHelpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const answer = helpInput.trim();
    if (!answer) return;

    const nextQuestions = [
      "Entendido. ¿Cómo se llama el comercio, servicio o evento?",
      "¿A qué se dedica o qué actividad realizará? Cuéntamelo con tus palabras.",
      "¿En qué barrio o zona de Coronel Oviedo se encuentra o trabaja?",
      "¿Cuál es el número de celular o WhatsApp de contacto?",
      "Muy bien. Continuaremos hasta completar los datos y luego podrás revisarlos antes de publicar.",
    ];
    const userMessages = helpMessages.filter(
      (message) => message.role === "user",
    ).length;

    setHelpMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", content: answer },
      {
        id: Date.now() + 1,
        role: "assistant",
        content:
          nextQuestions[Math.min(userMessages, nextQuestions.length - 1)],
      },
    ]);
    setHelpInput("");
  }

  function chooseHelpType(type: ListingType, label: string) {
    changeListingType(type);
    setHelpMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", content: label },
      {
        id: Date.now() + 1,
        role: "assistant",
        content: `Perfecto. ¿Cómo se llama ${type === "evento" ? "el evento" : type === "servicio" ? "el profesional o servicio" : "el comercio"}?`,
      },
    ]);
  }

  function handleSaveDraft() {
    setDraftMessage(
      "Borrador preparado. Al conectar el backend se guardará de forma segura en tu cuenta.",
    );
  }

  function updateAdditionalContact(index: number, value: string) {
    const contacts = [...formData.additionalContacts];
    contacts[index] = value;
    updateField("additionalContacts", contacts);
  }

  function updateSocialLink(
    index: number,
    field: keyof SocialLink,
    value: SocialLink[keyof SocialLink],
  ) {
    const links = formData.socialLinks.map((link, linkIndex) =>
      linkIndex === index ? { ...link, [field]: value } : link,
    );
    updateField("socialLinks", links);
  }

  function togglePaymentMethod(method: PaymentMethod) {
    updateField(
      "paymentMethods",
      formData.paymentMethods.includes(method)
        ? formData.paymentMethods.filter((item) => item !== method)
        : [...formData.paymentMethods, method],
    );
  }

  function updateBusinessHour(index: number, changes: Partial<BusinessHour>) {
    updateField(
      "businessHours",
      formData.businessHours.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item,
      ),
    );
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Tu navegador no permite obtener la ubicación.");
      return;
    }

    setLocating(true);
    setLocationMessage("");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        updateField("latitude", coords.latitude.toFixed(6));
        updateField("longitude", coords.longitude.toFixed(6));
        setLocating(false);
        setLocationMessage("Ubicación obtenida correctamente.");
      },
      () => {
        setLocating(false);
        setLocationMessage(
          "No pudimos obtener la ubicación. Revisa el permiso del navegador.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function validateStep(currentStep: number) {
    const nextErrors: FieldErrors = {};

    if (currentStep === 1) {
      if (!formData.name.trim()) {
        nextErrors.name =
          formData.type === "evento"
            ? "Ingresa el nombre del evento."
            : formData.type === "servicio"
              ? "Ingresa el nombre del servicio o profesional."
              : "Ingresa el nombre del comercio.";
      }

      if (!formData.category) {
        nextErrors.category = "Selecciona una categoría.";
      }

      if (formData.description.trim().length < 30) {
        nextErrors.description =
          "Describe la propuesta con al menos 30 caracteres.";
      }

      if (formData.type === "comercio") {
        if (!formData.documentType) {
          nextErrors.documentType = "Selecciona RUC o número de cédula.";
        }

        if (!formData.documentNumber.trim()) {
          nextErrors.documentNumber =
            formData.documentType === "ruc"
              ? "Ingresa el número base del RUC."
              : "Ingresa el número de cédula.";
        }

        if (
          formData.documentType === "ruc" &&
          !formData.documentVerifier.trim()
        ) {
          nextErrors.documentVerifier =
            "Ingresa el dígito verificador del RUC.";
        }
      }

      if (!formData.imageName) {
        nextErrors.imageName = "Agrega una imagen principal.";
      }
    }

    if (currentStep === 2) {
      if (!formData.neighborhood.trim())
        nextErrors.neighborhood = "Indica el barrio o zona.";
      if (formData.type !== "servicio" && !formData.address.trim()) {
        nextErrors.address = "Indica la dirección de la publicación.";
      }
      if (formData.type !== "servicio" && !formData.locationReference.trim()) {
        nextErrors.locationReference = "Agrega una referencia de ubicación.";
      }
      if (formData.type === "servicio" && !formData.serviceArea.trim()) {
        nextErrors.serviceArea = "Indica el área donde prestas el servicio.";
      }
      if (!formData.whatsapp.trim()) {
        nextErrors.whatsapp = "Ingresa un número de celular o WhatsApp.";
      }
      if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
        nextErrors.email = "Ingresa un correo válido.";
      }
      if (formData.additionalContacts.some((contact) => !contact.trim())) {
        nextErrors.additionalContacts =
          "Completa o elimina los contactos adicionales vacíos.";
      }
      if (
        formData.socialLinks.some((link) => !link.network || !link.url.trim())
      ) {
        nextErrors.socialLinks =
          "Completa la red social y su enlace, o elimina la fila vacía.";
      }
    }

    if (currentStep === 3) {
      if (formData.type === "comercio") {
        if (!formData.invoiceStatus) {
          nextErrors.invoiceStatus = "Indica si el comercio emite factura.";
        }

        const openDays = formData.businessHours.filter((item) => item.isOpen);
        if (openDays.length === 0) {
          nextErrors.businessHours = "Selecciona al menos un día de atención.";
        } else if (
          openDays.some(
            (item) => !item.is24Hours && (!item.openTime || !item.closeTime),
          )
        ) {
          nextErrors.businessHours =
            "Completa la hora de apertura y cierre de los días habilitados.";
        }
      }

      if (formData.type === "servicio") {
        if (
          !formData.serviceAtHome &&
          !formData.serviceFixedLocation &&
          !formData.serviceRemote
        ) {
          nextErrors.serviceAtHome =
            "Selecciona al menos una modalidad de atención.";
        }
        if (!formData.availabilityNotes.trim()) {
          nextErrors.availabilityNotes = "Describe tu disponibilidad.";
        }
        if (!formData.invoiceStatus) {
          nextErrors.invoiceStatus = "Indica si emites factura.";
        }
      }

      if (formData.type === "evento") {
        if (!formData.eventStart) {
          nextErrors.eventStart = "Indica la fecha y hora de inicio.";
        }
        if (!formData.eventEnd) {
          nextErrors.eventEnd = "Indica la fecha y hora de finalización.";
        }
        if (
          formData.eventStart &&
          formData.eventEnd &&
          new Date(formData.eventEnd) < new Date(formData.eventStart)
        ) {
          nextErrors.eventEnd = "La finalización debe ser posterior al inicio.";
        }
        if (!formData.eventPricing) {
          nextErrors.eventPricing =
            "Indica si el evento es gratuito o de pago.";
        }
        if (formData.eventPricing === "paid" && !formData.ticketPrice.trim()) {
          nextErrors.ticketPrice = "Indica el precio de la entrada.";
        }
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function goForward() {
    if (!validateStep(step)) return;
    setStep((current) => Math.min(current + 1, 4));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setErrors({});
    setStep((current) => Math.max(current - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!acceptedTypes.includes(file.type)) {
      setErrors((current) => ({
        ...current,
        imageName: "Usa una imagen JPG, PNG o WEBP.",
      }));
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((current) => ({
        ...current,
        imageName: "La imagen no debe superar 5 MB.",
      }));
      event.target.value = "";
      return;
    }

    updateField("imageName", file.name);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Si todavía no estamos en la revisión, solo avanza de paso.
    if (step < 4) {
      goForward();
      return;
    }

    // Publicar únicamente desde el paso 4.
    for (const currentStep of [1, 2, 3]) {
      if (!validateStep(currentStep)) {
        setStep(currentStep);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (submitted) {
    return (
      <section className="mx-auto flex min-h-[640px] w-full max-w-3xl items-center px-5 py-14 sm:px-8">
        <div className="w-full rounded-3xl border border-border bg-surface p-7 text-center shadow-[0_22px_60px_rgba(11,31,51,0.08)] sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 aria-hidden="true" className="h-8 w-8" />
          </div>
          <p className="mt-6 text-sm font-semibold text-primary">
            Datos completados
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-foreground">
            Tu publicación está preparada
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-text-secondary sm:text-base">
            “{formData.name}” quedó registrada. Al conectar el backend, Austro
            decidirá si puede mostrarse directamente o si necesita una revisión
            adicional.
          </p>

          <div className="mx-auto mt-7 flex max-w-md items-start gap-3 rounded-2xl bg-surface-soft p-4 text-left">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-primary"
            />
            <p className="text-sm leading-6 text-text-secondary">
              Los datos normales podrán publicarse automáticamente. Los casos
              sensibles o con inconsistencias pasarán a moderación.
            </p>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/explorar"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Ir a Explorar
            </Link>
            <button
              type="button"
              onClick={() => {
                setFormData(initialFormData);
                setStep(1);
                setSubmitted(false);
                setLocationMessage("");
                setImagePreview("");
                setDraftMessage("");
              }}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-surface-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Crear otra publicación
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-start">
        <div>
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-primary">
              Publica en Austro
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-4xl">
              Crea una publicación clara y confiable
            </h1>
            <p className="mt-4 text-sm leading-6 text-text-secondary sm:text-base">
              Completa la información principal. Podrás revisar todo antes de
              enviarlo.
            </p>
          </div>

          <div className="mt-6 lg:hidden">
            <AssistantLauncher onOpen={() => setHelpOpen(true)} />
          </div>

          <ol className="mt-8 grid grid-cols-4 gap-2" aria-label="Progreso">
            {["Información", "Ubicación", "Detalles", "Revisión"].map(
              (label, index) => {
                const itemStep = index + 1;
                const isComplete = itemStep < step;
                const isActive = itemStep === step;

                return (
                  <li key={label} className="min-w-0">
                    <div
                      className={`h-1.5 rounded-full ${
                        itemStep <= step
                          ? selectedType.visual.accentBar
                          : "bg-border"
                      }`}
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isActive || isComplete
                            ? `${selectedType.visual.accentBar} text-white`
                            : "bg-surface-soft text-text-secondary"
                        }`}
                      >
                        {isComplete ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          itemStep
                        )}
                      </span>
                      <span
                        className={`hidden truncate text-xs font-semibold sm:block ${
                          isActive
                            ? selectedType.visual.accentText
                            : "text-text-secondary"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  </li>
                );
              },
            )}
          </ol>

          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-3xl border border-border/80 bg-surface p-5 shadow-[0_18px_50px_rgba(11,31,51,0.06)] sm:p-7"
          >
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  ¿Qué quieres publicar?
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Elige el tipo para adaptar los campos de la publicación.
                </p>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {publicationTypes.map((option) => {
                    const Icon = option.icon;
                    const isSelected = formData.type === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => changeListingType(option.value)}
                        className={`rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          isSelected
                            ? option.visual.selectedCard
                            : "border-border hover:border-primary/25 hover:bg-surface-soft"
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                            isSelected
                              ? option.visual.selectedIcon
                              : option.visual.idleIcon
                          }`}
                        >
                          <Icon aria-hidden="true" className="h-5 w-5" />
                        </span>

                        <span className="mt-4 block text-sm font-bold text-foreground">
                          {option.label}
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-text-secondary">
                          {option.description}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div
                  className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 ${selectedType.visual.contextPanel}`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selectedType.visual.idleIcon}`}
                  >
                    {(() => {
                      const SelectedTypeIcon = selectedType.icon;
                      return (
                        <SelectedTypeIcon
                          aria-hidden="true"
                          className="h-5 w-5"
                        />
                      );
                    })()}
                  </span>

                  <div>
                    <p
                      className={`text-sm font-bold ${selectedType.visual.accentText}`}
                    >
                      Publicación de {selectedType.label.toLowerCase()}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-text-secondary">
                      {selectedType.contextMessage}
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="publication-name"
                      className="text-sm font-semibold text-foreground"
                    >
                      {formData.type === "evento"
                        ? "Título del evento"
                        : formData.type === "servicio"
                          ? "Nombre del profesional o servicio"
                          : "Nombre del comercio"}{" "}
                      *
                    </label>
                    <input
                      id="publication-name"
                      type="text"
                      value={formData.name}
                      onChange={(event) =>
                        updateField("name", event.target.value)
                      }
                      placeholder={
                        formData.type === "evento"
                          ? "Ej.: Feria gastronómica local"
                          : formData.type === "servicio"
                            ? "Ej.: Electricista Juan Pérez"
                            : "Ej.: Sabores de Oviedo"
                      }
                      className={inputClass}
                    />
                    <FieldError message={errors.name} />
                  </div>

                  <div>
                    <label
                      htmlFor="publication-category"
                      className="text-sm font-semibold text-foreground"
                    >
                      Categoría *
                    </label>
                    <div className="relative">
                      <select
                        id="publication-category"
                        value={formData.category}
                        onChange={(event) =>
                          updateField("category", event.target.value)
                        }
                        className={`${inputClass} appearance-none pr-10`}
                      >
                        <option value="">Seleccionar categoría</option>
                        {categoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-[26px] h-4 w-4 text-text-secondary" />
                    </div>
                    <FieldError message={errors.category} />
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-4">
                    <label
                      htmlFor="publication-description"
                      className="text-sm font-semibold text-foreground"
                    >
                      Descripción *
                    </label>
                    <span className="text-xs text-text-secondary">
                      {formData.description.length}/500
                    </span>
                  </div>
                  <textarea
                    id="publication-description"
                    value={formData.description}
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value.slice(0, 500),
                      )
                    }
                    rows={5}
                    placeholder="Explica qué ofreces, para quién es y qué hace especial a tu propuesta."
                    className="mt-2 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                  <FieldError message={errors.description} />
                </div>

                {formData.type === "comercio" && (
                  <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 sm:p-5">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        Identificación del comercio
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-text-secondary">
                        Esta información será privada y se utilizará únicamente
                        para verificar al responsable de la publicación.
                      </p>
                    </div>

                    <div className="mt-4 grid gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="publication-document-type"
                          className="text-sm font-semibold text-foreground"
                        >
                          Tipo de identificación *
                        </label>

                        <div className="relative">
                          <select
                            id="publication-document-type"
                            value={formData.documentType}
                            onChange={(event) =>
                              changeDocumentType(
                                event.target.value as DocumentType,
                              )
                            }
                            className={`${inputClass} appearance-none pr-10`}
                          >
                            <option value="">Seleccionar</option>
                            <option value="ruc">RUC</option>
                            <option value="ci">Número de cédula</option>
                          </select>

                          <ChevronDown
                            aria-hidden="true"
                            className="pointer-events-none absolute right-3 top-[26px] h-4 w-4 text-text-secondary"
                          />
                        </div>

                        <FieldError message={errors.documentType} />
                      </div>

                      <div
                        className={
                          formData.documentType === "ruc"
                            ? "grid grid-cols-[minmax(0,1fr)_88px] gap-3"
                            : undefined
                        }
                      >
                        <div>
                          <label
                            htmlFor="publication-document-number"
                            className="text-sm font-semibold text-foreground"
                          >
                            {formData.documentType === "ruc"
                              ? "Número de RUC"
                              : formData.documentType === "ci"
                                ? "Número de cédula"
                                : "Número de identificación"}{" "}
                            *
                          </label>

                          <input
                            id="publication-document-number"
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            value={formData.documentNumber}
                            onChange={(event) =>
                              changeDocumentNumber(event.target.value)
                            }
                            placeholder={
                              formData.documentType === "ruc"
                                ? "Ej.: 80012345"
                                : "Ej.: 4123456"
                            }
                            className={inputClass}
                          />

                          <FieldError message={errors.documentNumber} />
                        </div>

                        {formData.documentType === "ruc" && (
                          <div>
                            <label
                              htmlFor="publication-document-verifier"
                              className="text-sm font-semibold text-foreground"
                            >
                              DV *
                            </label>
                            <input
                              id="publication-document-verifier"
                              type="text"
                              inputMode="numeric"
                              autoComplete="off"
                              maxLength={1}
                              value={formData.documentVerifier}
                              onChange={(event) =>
                                updateField(
                                  "documentVerifier",
                                  normalizeDigits(event.target.value, 1),
                                )
                              }
                              placeholder="6"
                              aria-label="Dígito verificador del RUC"
                              className={`${inputClass} text-center`}
                            />
                            <FieldError message={errors.documentVerifier} />
                          </div>
                        )}
                      </div>

                      {formData.documentType && (
                        <p className="text-xs leading-5 text-text-secondary sm:col-span-2">
                          Ingresa solo números. Austro elimina automáticamente
                          puntos, espacios y guiones.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-4">
                    <label
                      htmlFor="publication-additional-info"
                      className="text-sm font-semibold text-foreground"
                    >
                      Información adicional
                      <span className="ml-1 font-normal text-text-secondary">
                        (opcional)
                      </span>
                    </label>

                    <span className="text-xs text-text-secondary">
                      {formData.additionalInfo.length}/300
                    </span>
                  </div>

                  <textarea
                    id="publication-additional-info"
                    value={formData.additionalInfo}
                    onChange={(event) =>
                      updateField(
                        "additionalInfo",
                        event.target.value.slice(0, 300),
                      )
                    }
                    rows={3}
                    placeholder="Agrega alguna aclaración que pueda ser útil para los visitantes."
                    className="mt-2 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="publication-image"
                    className="text-sm font-semibold text-foreground"
                  >
                    Imagen principal *
                  </label>
                  <label
                    htmlFor="publication-image"
                    className="mt-2 flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-border p-4 transition-colors hover:border-primary/40 hover:bg-surface-soft"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-soft text-primary">
                      <ImagePlus className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {formData.imageName || "Seleccionar imagen"}
                      </span>
                      <span className="mt-1 block text-xs text-text-secondary">
                        JPG, PNG o WEBP · máximo 5 MB
                      </span>
                    </span>
                  </label>
                  <input
                    id="publication-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImage}
                    className="sr-only"
                  />
                  <FieldError message={errors.imageName} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {selectedType.stepTwoTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {selectedType.stepTwoDescription}
                </p>

                <section className="mt-6 rounded-2xl border border-border p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selectedType.visual.idleIcon}`}
                    >
                      <MapPin aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {formData.type === "servicio"
                          ? "Zona donde prestas el servicio"
                          : "Ubicación de la publicación"}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-text-secondary">
                        Completa los datos necesarios para que puedan
                        encontrarte con facilidad.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="publication-city"
                        className="text-sm font-semibold text-foreground"
                      >
                        Ciudad *
                      </label>
                      <input
                        id="publication-city"
                        type="text"
                        value={formData.city}
                        readOnly
                        aria-readonly="true"
                        className={`${inputClass} cursor-not-allowed bg-surface-soft text-text-secondary`}
                      />
                      <p className="mt-1.5 text-xs leading-5 text-text-secondary">
                        Austro está disponible actualmente solo para esta
                        localidad.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="publication-neighborhood"
                        className="text-sm font-semibold text-foreground"
                      >
                        Barrio o zona *
                      </label>
                      <input
                        id="publication-neighborhood"
                        type="text"
                        value={formData.neighborhood}
                        onChange={(event) =>
                          updateField("neighborhood", event.target.value)
                        }
                        placeholder="Ej.: Centro"
                        className={inputClass}
                      />
                      <FieldError message={errors.neighborhood} />
                    </div>
                  </div>

                  {formData.type === "servicio" ? (
                    <div className="mt-5">
                      <label
                        htmlFor="publication-service-area"
                        className="text-sm font-semibold text-foreground"
                      >
                        Área de cobertura *
                      </label>
                      <input
                        id="publication-service-area"
                        type="text"
                        value={formData.serviceArea}
                        onChange={(event) =>
                          updateField("serviceArea", event.target.value)
                        }
                        placeholder="Ej.: Todo Coronel Oviedo y alrededores"
                        className={inputClass}
                      />
                      <FieldError message={errors.serviceArea} />
                    </div>
                  ) : (
                    <>
                      <div className="mt-5">
                        <label
                          htmlFor="publication-address"
                          className="text-sm font-semibold text-foreground"
                        >
                          Dirección *
                        </label>
                        <input
                          id="publication-address"
                          type="text"
                          value={formData.address}
                          onChange={(event) =>
                            updateField("address", event.target.value)
                          }
                          placeholder="Ej.: Av. Mariscal López 1250"
                          className={inputClass}
                        />
                        <FieldError message={errors.address} />
                      </div>

                      <div className="mt-5">
                        <label
                          htmlFor="publication-location-reference"
                          className="text-sm font-semibold text-foreground"
                        >
                          Referencia de ubicación *
                        </label>
                        <textarea
                          id="publication-location-reference"
                          value={formData.locationReference}
                          onChange={(event) =>
                            updateField("locationReference", event.target.value)
                          }
                          rows={2}
                          placeholder="Ej.: Al lado de la universidad, frente a la plaza."
                          className="mt-2 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                        <FieldError message={errors.locationReference} />
                      </div>

                      <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface-soft/50">
                        {mapEmbedUrl ? (
                          <iframe
                            title="Vista previa de la ubicación"
                            src={mapEmbedUrl}
                            className="h-56 w-full border-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-44 flex-col items-center justify-center px-5 text-center">
                            <MapPin
                              aria-hidden="true"
                              className="h-7 w-7 text-text-secondary"
                            />
                            <p className="mt-3 text-sm font-semibold text-foreground">
                              Todavía no seleccionaste el punto del mapa
                            </p>
                            <p className="mt-1 max-w-sm text-xs leading-5 text-text-secondary">
                              Puedes obtener la posición exacta desde el lugar
                              del comercio o evento.
                            </p>
                          </div>
                        )}

                        <div className="flex flex-col gap-3 border-t border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold text-foreground">
                              {formData.latitude && formData.longitude
                                ? `${formData.latitude}, ${formData.longitude}`
                                : "Ubicación exacta pendiente"}
                            </p>
                            {locationMessage && (
                              <p className="mt-1 text-xs text-text-secondary">
                                {locationMessage}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={useCurrentLocation}
                            disabled={locating}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-wait disabled:opacity-60"
                          >
                            <Navigation
                              aria-hidden="true"
                              className="h-4 w-4"
                            />
                            {locating
                              ? "Obteniendo..."
                              : "Usar mi ubicación actual"}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </section>

                <section className="mt-5 rounded-2xl border border-border p-4 sm:p-5">
                  <h3 className="text-sm font-bold text-foreground">
                    Contactos y enlaces
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-text-secondary">
                    El celular principal será el medio de contacto visible.
                  </p>

                  <div className="mt-4">
                    <label
                      htmlFor="publication-whatsapp"
                      className="text-sm font-semibold text-foreground"
                    >
                      Celular o WhatsApp principal *
                    </label>
                    <input
                      id="publication-whatsapp"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={formData.whatsapp}
                      onChange={(event) =>
                        updateField("whatsapp", event.target.value)
                      }
                      placeholder="Ej.: 0981 000 000"
                      className={inputClass}
                    />
                    <FieldError message={errors.whatsapp} />
                  </div>

                  {formData.additionalContacts.map((contact, index) => (
                    <div key={index} className="mt-4 flex items-end gap-3">
                      <div className="min-w-0 flex-1">
                        <label
                          htmlFor={`publication-contact-${index}`}
                          className="text-sm font-semibold text-foreground"
                        >
                          Contacto adicional {index + 1}
                        </label>
                        <input
                          id={`publication-contact-${index}`}
                          type="tel"
                          inputMode="tel"
                          value={contact}
                          onChange={(event) =>
                            updateAdditionalContact(index, event.target.value)
                          }
                          placeholder="Ej.: 0971 000 000"
                          className={inputClass}
                        />
                      </div>
                      <button
                        type="button"
                        aria-label={`Eliminar contacto adicional ${index + 1}`}
                        onClick={() =>
                          updateField(
                            "additionalContacts",
                            formData.additionalContacts.filter(
                              (_, contactIndex) => contactIndex !== index,
                            ),
                          )
                        }
                        className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-text-secondary transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <FieldError message={errors.additionalContacts} />

                  <button
                    type="button"
                    onClick={() =>
                      updateField("additionalContacts", [
                        ...formData.additionalContacts,
                        "",
                      ])
                    }
                    className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-4 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-surface-soft hover:text-primary"
                  >
                    <Plus aria-hidden="true" className="h-4 w-4" />
                    Agregar otro contacto
                  </button>

                  <div className="mt-5 grid gap-5 border-t border-border/70 pt-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="publication-email"
                        className="text-sm font-semibold text-foreground"
                      >
                        Correo electrónico
                        <span className="ml-1 font-normal text-text-secondary">
                          (opcional)
                        </span>
                      </label>
                      <input
                        id="publication-email"
                        type="email"
                        value={formData.email}
                        onChange={(event) =>
                          updateField("email", event.target.value)
                        }
                        placeholder="contacto@ejemplo.com"
                        className={inputClass}
                      />
                      <FieldError message={errors.email} />
                    </div>
                    <div>
                      <label
                        htmlFor="publication-website"
                        className="text-sm font-semibold text-foreground"
                      >
                        Sitio web
                        <span className="ml-1 font-normal text-text-secondary">
                          (opcional)
                        </span>
                      </label>
                      <input
                        id="publication-website"
                        type="url"
                        value={formData.website}
                        onChange={(event) =>
                          updateField("website", event.target.value)
                        }
                        placeholder="https://ejemplo.com"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="mt-5 border-t border-border/70 pt-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Redes sociales
                        </h4>
                        <p className="mt-1 text-xs text-text-secondary">
                          Agrega únicamente las redes que utilizas.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateField("socialLinks", [
                            ...formData.socialLinks,
                            { network: "", url: "" },
                          ])
                        }
                        className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-border px-4 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-surface-soft hover:text-primary"
                      >
                        <Plus aria-hidden="true" className="h-4 w-4" />
                        Agregar red
                      </button>
                    </div>

                    {formData.socialLinks.map((link, index) => (
                      <div
                        key={index}
                        className="mt-4 grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)_44px] sm:items-end"
                      >
                        <div>
                          <label
                            htmlFor={`publication-social-network-${index}`}
                            className="text-sm font-semibold text-foreground"
                          >
                            Red social
                          </label>
                          <select
                            id={`publication-social-network-${index}`}
                            value={link.network}
                            onChange={(event) =>
                              updateSocialLink(
                                index,
                                "network",
                                event.target.value as SocialNetwork,
                              )
                            }
                            className={`${inputClass} appearance-none`}
                          >
                            <option value="">Seleccionar</option>
                            <option value="facebook">Facebook</option>
                            <option value="instagram">Instagram</option>
                            <option value="tiktok">TikTok</option>
                            <option value="youtube">YouTube</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="otro">Otra</option>
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor={`publication-social-url-${index}`}
                            className="text-sm font-semibold text-foreground"
                          >
                            Enlace
                          </label>
                          <input
                            id={`publication-social-url-${index}`}
                            type="url"
                            value={link.url}
                            onChange={(event) =>
                              updateSocialLink(index, "url", event.target.value)
                            }
                            placeholder="https://"
                            className={inputClass}
                          />
                        </div>
                        <button
                          type="button"
                          aria-label={`Eliminar red social ${index + 1}`}
                          onClick={() =>
                            updateField(
                              "socialLinks",
                              formData.socialLinks.filter(
                                (_, linkIndex) => linkIndex !== index,
                              ),
                            )
                          }
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-text-secondary transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <FieldError message={errors.socialLinks} />
                  </div>
                </section>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selectedType.visual.idleIcon}`}
                  >
                    {formData.type === "evento" ? (
                      <CalendarDays className="h-5 w-5" />
                    ) : formData.type === "servicio" ? (
                      <BriefcaseBusiness className="h-5 w-5" />
                    ) : (
                      <Clock3 className="h-5 w-5" />
                    )}
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {formData.type === "evento"
                        ? "Fecha y condiciones del evento"
                        : formData.type === "servicio"
                          ? "Modalidad y disponibilidad profesional"
                          : "Horarios y servicios del comercio"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">
                      {formData.type === "evento"
                        ? "Define cuándo se realizará y cómo podrán participar las personas."
                        : formData.type === "servicio"
                          ? "Explica cómo, cuándo y bajo qué condiciones prestas el servicio."
                          : "Configura los días de atención y las facilidades disponibles."}
                    </p>
                  </div>
                </div>

                {formData.type === "comercio" && (
                  <>
                    <section className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/35 p-4 sm:p-5">
                      <h3 className="text-sm font-bold text-foreground">
                        Horario de atención
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-text-secondary">
                        Habilita los días en que el comercio atiende al público.
                      </p>

                      <div className="mt-4 space-y-3">
                        {formData.businessHours.map((schedule, index) => (
                          <div
                            key={schedule.day}
                            className="grid gap-3 rounded-xl border border-border bg-surface p-3 sm:grid-cols-[120px_90px_minmax(0,1fr)] sm:items-center"
                          >
                            <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
                              <input
                                type="checkbox"
                                checked={schedule.isOpen}
                                onChange={(event) =>
                                  updateBusinessHour(index, {
                                    isOpen: event.target.checked,
                                  })
                                }
                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                              />
                              {schedule.label}
                            </label>

                            <label className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                              <input
                                type="checkbox"
                                checked={schedule.is24Hours}
                                disabled={!schedule.isOpen}
                                onChange={(event) =>
                                  updateBusinessHour(index, {
                                    is24Hours: event.target.checked,
                                  })
                                }
                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary disabled:opacity-40"
                              />
                              24 horas
                            </label>

                            {schedule.isOpen && !schedule.is24Hours ? (
                              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                <input
                                  aria-label={`Apertura del ${schedule.label}`}
                                  type="time"
                                  value={schedule.openTime}
                                  onChange={(event) =>
                                    updateBusinessHour(index, {
                                      openTime: event.target.value,
                                    })
                                  }
                                  className="h-10 min-w-0 rounded-lg border border-border bg-surface px-2 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                                />
                                <span className="text-xs text-text-secondary">
                                  a
                                </span>
                                <input
                                  aria-label={`Cierre del ${schedule.label}`}
                                  type="time"
                                  value={schedule.closeTime}
                                  onChange={(event) =>
                                    updateBusinessHour(index, {
                                      closeTime: event.target.value,
                                    })
                                  }
                                  className="h-10 min-w-0 rounded-lg border border-border bg-surface px-2 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                                />
                              </div>
                            ) : (
                              <p className="text-xs font-medium text-text-secondary">
                                {schedule.isOpen
                                  ? "Abierto todo el día"
                                  : "Cerrado"}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                      <FieldError message={errors.businessHours} />
                    </section>

                    <section className="mt-5 rounded-2xl border border-border p-4 sm:p-5">
                      <h3 className="text-sm font-bold text-foreground">
                        Servicios disponibles
                      </h3>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {[
                          ["delivery", "Entrega a domicilio"],
                          ["pickup", "Retiro en el local"],
                          ["reservations", "Reservas"],
                          ["parking", "Estacionamiento"],
                          [
                            "accessibility",
                            "Acceso para personas con discapacidad",
                          ],
                          ["afterHoursMessages", "Mensajes fuera del horario"],
                        ].map(([field, label]) => (
                          <ToggleCard
                            key={field}
                            label={label}
                            checked={
                              formData[field as keyof FormData] as boolean
                            }
                            onChange={(checked) =>
                              updateField(
                                field as keyof FormData,
                                checked as never,
                              )
                            }
                          />
                        ))}
                      </div>
                    </section>
                  </>
                )}

                {formData.type === "servicio" && (
                  <>
                    <section className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/35 p-4 sm:p-5">
                      <h3 className="text-sm font-bold text-foreground">
                        Modalidad de atención *
                      </h3>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <ToggleCard
                          label="A domicilio"
                          checked={formData.serviceAtHome}
                          onChange={(checked) =>
                            updateField("serviceAtHome", checked)
                          }
                        />
                        <ToggleCard
                          label="Ubicación fija"
                          checked={formData.serviceFixedLocation}
                          onChange={(checked) =>
                            updateField("serviceFixedLocation", checked)
                          }
                        />
                        <ToggleCard
                          label="Atención remota"
                          checked={formData.serviceRemote}
                          onChange={(checked) =>
                            updateField("serviceRemote", checked)
                          }
                        />
                      </div>
                      <FieldError message={errors.serviceAtHome} />

                      <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="publication-availability"
                            className="text-sm font-semibold text-foreground"
                          >
                            Disponibilidad *
                          </label>
                          <textarea
                            id="publication-availability"
                            rows={3}
                            value={formData.availabilityNotes}
                            onChange={(event) =>
                              updateField(
                                "availabilityNotes",
                                event.target.value,
                              )
                            }
                            placeholder="Ej.: Lunes a sábado, de 08:00 a 18:00"
                            className="mt-2 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/15"
                          />
                          <FieldError message={errors.availabilityNotes} />
                        </div>
                        <div>
                          <label
                            htmlFor="publication-price-from"
                            className="text-sm font-semibold text-foreground"
                          >
                            Precio desde
                            <span className="ml-1 font-normal text-text-secondary">
                              (opcional)
                            </span>
                          </label>
                          <input
                            id="publication-price-from"
                            type="text"
                            inputMode="decimal"
                            value={formData.priceFrom}
                            onChange={(event) =>
                              updateField("priceFrom", event.target.value)
                            }
                            placeholder="Ej.: G. 100.000"
                            className={inputClass}
                          />
                          <p className="mt-2 text-xs leading-5 text-text-secondary">
                            Indica un valor orientativo; el presupuesto final
                            puede variar.
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className="mt-5 rounded-2xl border border-border p-4 sm:p-5">
                      <h3 className="text-sm font-bold text-foreground">
                        Condiciones del servicio
                      </h3>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <ToggleCard
                          label="Requiere cita o reserva"
                          checked={formData.requiresAppointment}
                          onChange={(checked) =>
                            updateField("requiresAppointment", checked)
                          }
                        />
                        <ToggleCard
                          label="Ofrece presupuesto previo"
                          checked={formData.offersQuote}
                          onChange={(checked) =>
                            updateField("offersQuote", checked)
                          }
                        />
                        <ToggleCard
                          label="Atención urgente o 24 horas"
                          checked={formData.urgentService}
                          onChange={(checked) =>
                            updateField("urgentService", checked)
                          }
                        />
                        <ToggleCard
                          label="Mensajes fuera del horario"
                          checked={formData.afterHoursMessages}
                          onChange={(checked) =>
                            updateField("afterHoursMessages", checked)
                          }
                        />
                      </div>
                    </section>
                  </>
                )}

                {formData.type === "evento" && (
                  <>
                    <section className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/35 p-4 sm:p-5">
                      <h3 className="text-sm font-bold text-foreground">
                        Fecha y hora
                      </h3>
                      <div className="mt-4 grid gap-5 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="publication-event-start"
                            className="text-sm font-semibold text-foreground"
                          >
                            Inicio *
                          </label>
                          <input
                            id="publication-event-start"
                            type="datetime-local"
                            value={formData.eventStart}
                            onChange={(event) =>
                              updateField("eventStart", event.target.value)
                            }
                            className={inputClass}
                          />
                          <FieldError message={errors.eventStart} />
                        </div>
                        <div>
                          <label
                            htmlFor="publication-event-end"
                            className="text-sm font-semibold text-foreground"
                          >
                            Finalización *
                          </label>
                          <input
                            id="publication-event-end"
                            type="datetime-local"
                            min={formData.eventStart || undefined}
                            value={formData.eventEnd}
                            onChange={(event) =>
                              updateField("eventEnd", event.target.value)
                            }
                            className={inputClass}
                          />
                          <FieldError message={errors.eventEnd} />
                        </div>
                      </div>
                    </section>

                    <section className="mt-5 rounded-2xl border border-border p-4 sm:p-5">
                      <h3 className="text-sm font-bold text-foreground">
                        Acceso al evento *
                      </h3>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {[
                          ["free", "Evento gratuito"],
                          ["paid", "Evento de pago"],
                        ].map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={formData.eventPricing === value}
                            onClick={() =>
                              updateField("eventPricing", value as EventPricing)
                            }
                            className={`rounded-xl border p-4 text-left text-sm font-semibold transition-colors ${
                              formData.eventPricing === value
                                ? "border-orange-300 bg-orange-50 text-orange-800"
                                : "border-border text-foreground hover:bg-surface-soft"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <FieldError message={errors.eventPricing} />

                      {formData.eventPricing === "paid" && (
                        <div className="mt-5 grid gap-5 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="publication-ticket-price"
                              className="text-sm font-semibold text-foreground"
                            >
                              Precio de entrada *
                            </label>
                            <input
                              id="publication-ticket-price"
                              type="text"
                              inputMode="decimal"
                              value={formData.ticketPrice}
                              onChange={(event) =>
                                updateField("ticketPrice", event.target.value)
                              }
                              placeholder="Ej.: G. 50.000"
                              className={inputClass}
                            />
                            <FieldError message={errors.ticketPrice} />
                          </div>
                          <div>
                            <label
                              htmlFor="publication-ticket-url"
                              className="text-sm font-semibold text-foreground"
                            >
                              Enlace de entradas
                              <span className="ml-1 font-normal text-text-secondary">
                                (opcional)
                              </span>
                            </label>
                            <input
                              id="publication-ticket-url"
                              type="url"
                              value={formData.ticketUrl}
                              onChange={(event) =>
                                updateField("ticketUrl", event.target.value)
                              }
                              placeholder="https://"
                              className={inputClass}
                            />
                          </div>
                        </div>
                      )}
                    </section>

                    <section className="mt-5 rounded-2xl border border-border p-4 sm:p-5">
                      <h3 className="text-sm font-bold text-foreground">
                        Información para asistentes
                      </h3>
                      <div className="mt-4 grid gap-5 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="publication-audience"
                            className="text-sm font-semibold text-foreground"
                          >
                            Público recomendado
                            <span className="ml-1 font-normal text-text-secondary">
                              (opcional)
                            </span>
                          </label>
                          <input
                            id="publication-audience"
                            type="text"
                            value={formData.recommendedAudience}
                            onChange={(event) =>
                              updateField(
                                "recommendedAudience",
                                event.target.value,
                              )
                            }
                            placeholder="Ej.: Familias y público general"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="publication-age"
                            className="text-sm font-semibold text-foreground"
                          >
                            Restricción de edad
                            <span className="ml-1 font-normal text-text-secondary">
                              (opcional)
                            </span>
                          </label>
                          <input
                            id="publication-age"
                            type="text"
                            value={formData.ageRestriction}
                            onChange={(event) =>
                              updateField("ageRestriction", event.target.value)
                            }
                            placeholder="Ej.: Mayores de 18 años"
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <ToggleCard
                          label="Cupos limitados"
                          checked={formData.limitedCapacity}
                          onChange={(checked) =>
                            updateField("limitedCapacity", checked)
                          }
                        />
                        <ToggleCard
                          label="Estacionamiento"
                          checked={formData.parking}
                          onChange={(checked) =>
                            updateField("parking", checked)
                          }
                        />
                        <ToggleCard
                          label="Acceso para personas con discapacidad"
                          checked={formData.accessibility}
                          onChange={(checked) =>
                            updateField("accessibility", checked)
                          }
                        />
                      </div>
                    </section>
                  </>
                )}

                {formData.type !== "evento" && (
                  <section className="mt-5 rounded-2xl border border-border p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          Facturación y medios de pago
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-text-secondary">
                          Selecciona una respuesta explícita sobre la factura y
                          los medios aceptados.
                        </p>
                      </div>
                    </div>

                    <fieldset className="mt-5">
                      <legend className="text-sm font-semibold text-foreground">
                        ¿{formData.type === "servicio" ? "Emites" : "Emite"}{" "}
                        factura legal? *
                      </legend>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          ["yes", "Sí"],
                          ["no", "No"],
                          ["prefer_not", "Prefiero no informar"],
                        ].map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={formData.invoiceStatus === value}
                            onClick={() =>
                              updateField(
                                "invoiceStatus",
                                value as InvoiceStatus,
                              )
                            }
                            className={`min-h-10 rounded-xl border px-4 text-xs font-semibold transition-colors ${
                              formData.invoiceStatus === value
                                ? "border-primary bg-blue-50 text-primary"
                                : "border-border text-foreground hover:bg-surface-soft"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <FieldError message={errors.invoiceStatus} />
                    </fieldset>

                    <fieldset className="mt-5 border-t border-border/70 pt-5">
                      <legend className="text-sm font-semibold text-foreground">
                        Medios de pago
                        <span className="ml-1 font-normal text-text-secondary">
                          (opcional)
                        </span>
                      </legend>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {paymentOptions.map((option) => {
                          const selected = formData.paymentMethods.includes(
                            option.value,
                          );
                          return (
                            <button
                              key={option.value}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => togglePaymentMethod(option.value)}
                              className={`min-h-10 rounded-xl border px-4 text-xs font-semibold transition-colors ${
                                selected
                                  ? "border-primary bg-primary text-white"
                                  : "border-border text-foreground hover:bg-surface-soft"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  </section>
                )}
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Revisa tu publicación
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Esta es la ficha completa. Verifica cada dato antes de
                  publicar o vuelve a editar lo que necesites.
                </p>

                <div className="mt-6 overflow-hidden rounded-2xl border border-border">
                  <div
                    className={`grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_180px] ${selectedType.visual.reviewHeader}`}
                  >
                    <div>
                      <span
                        className={`text-xs font-bold uppercase tracking-[0.08em] ${selectedType.visual.accentText}`}
                      >
                        {selectedType.label}
                      </span>
                      <h3 className="mt-1 text-xl font-bold text-foreground">
                        {formData.name || "Publicación sin nombre"}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-text-secondary">
                        {formData.description || "Sin descripción"}
                      </p>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-white/70 bg-white/70">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt={`Vista previa de ${formData.name || "la publicación"}`}
                          className="h-36 w-full object-cover sm:h-full"
                        />
                      ) : (
                        <div className="flex h-36 items-center justify-center text-text-secondary">
                          <ImagePlus className="h-7 w-7" />
                        </div>
                      )}
                    </div>
                  </div>

                  <ReviewSection title="Información principal">
                    <ReviewItem
                      label="Categoría"
                      value={
                        categoryOptions.find(
                          (option) => option.value === formData.category,
                        )?.label
                      }
                    />
                    <ReviewItem
                      label="Información adicional"
                      value={formData.additionalInfo}
                    />
                    {formData.type === "comercio" && (
                      <ReviewItem
                        label="Identificación privada"
                        value={
                          formData.documentType === "ruc"
                            ? `RUC ${formData.documentNumber}-${formData.documentVerifier}`
                            : `CI ${formData.documentNumber}`
                        }
                      />
                    )}
                    <ReviewItem label="Imagen" value={formData.imageName} />
                  </ReviewSection>

                  <ReviewSection title="Ubicación">
                    <ReviewItem label="Ciudad" value={LOCAL_CITY} />
                    <ReviewItem
                      label="Barrio o zona"
                      value={formData.neighborhood}
                    />
                    <ReviewItem
                      label={
                        formData.type === "servicio"
                          ? "Área de cobertura"
                          : "Dirección"
                      }
                      value={
                        formData.type === "servicio"
                          ? formData.serviceArea
                          : formData.address
                      }
                    />
                    {formData.type !== "servicio" && (
                      <ReviewItem
                        label="Referencia"
                        value={formData.locationReference}
                      />
                    )}
                    <ReviewItem
                      label="Ubicación en el mapa"
                      value={
                        formData.latitude && formData.longitude
                          ? `${formData.latitude}, ${formData.longitude}`
                          : "No seleccionada"
                      }
                    />
                  </ReviewSection>

                  <ReviewSection title="Contactos y enlaces">
                    <ReviewItem
                      label="Celular o WhatsApp"
                      value={formData.whatsapp}
                    />
                    <ReviewItem label="Correo" value={formData.email} />
                    <ReviewItem label="Sitio web" value={formData.website} />
                    <ReviewItem
                      label="Contactos adicionales"
                      value={formData.additionalContacts.join(", ")}
                    />
                    <ReviewItem
                      label="Redes sociales"
                      value={formData.socialLinks
                        .map((link) => `${link.network}: ${link.url}`)
                        .join(" · ")}
                    />
                  </ReviewSection>

                  {formData.type === "comercio" && (
                    <ReviewSection title="Horarios y servicios">
                      <ReviewItem
                        label="Horarios"
                        value={formData.businessHours
                          .filter((item) => item.isOpen)
                          .map((item) =>
                            item.is24Hours
                              ? `${item.label}: 24 horas`
                              : `${item.label}: ${item.openTime} a ${item.closeTime}`,
                          )
                          .join(" · ")}
                      />
                      <ReviewItem
                        label="Entrega a domicilio"
                        value={yesNoLabel(formData.delivery)}
                      />
                      <ReviewItem
                        label="Retiro en el local"
                        value={yesNoLabel(formData.pickup)}
                      />
                      <ReviewItem
                        label="Reservas"
                        value={yesNoLabel(formData.reservations)}
                      />
                      <ReviewItem
                        label="Estacionamiento"
                        value={yesNoLabel(formData.parking)}
                      />
                      <ReviewItem
                        label="Acceso para personas con discapacidad"
                        value={yesNoLabel(formData.accessibility)}
                      />
                      <ReviewItem
                        label="Mensajes fuera del horario"
                        value={yesNoLabel(formData.afterHoursMessages)}
                      />
                    </ReviewSection>
                  )}

                  {formData.type === "servicio" && (
                    <ReviewSection title="Modalidad y disponibilidad">
                      <ReviewItem
                        label="Modalidades"
                        value={[
                          formData.serviceAtHome && "A domicilio",
                          formData.serviceFixedLocation && "Ubicación fija",
                          formData.serviceRemote && "Atención remota",
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      />
                      <ReviewItem
                        label="Disponibilidad"
                        value={formData.availabilityNotes}
                      />
                      <ReviewItem
                        label="Precio desde"
                        value={formData.priceFrom}
                      />
                      <ReviewItem
                        label="Cita o reserva"
                        value={yesNoLabel(formData.requiresAppointment)}
                      />
                      <ReviewItem
                        label="Presupuesto previo"
                        value={yesNoLabel(formData.offersQuote)}
                      />
                      <ReviewItem
                        label="Atención urgente"
                        value={yesNoLabel(formData.urgentService)}
                      />
                    </ReviewSection>
                  )}

                  {formData.type === "evento" && (
                    <ReviewSection title="Fecha y acceso al evento">
                      <ReviewItem label="Inicio" value={formData.eventStart} />
                      <ReviewItem
                        label="Finalización"
                        value={formData.eventEnd}
                      />
                      <ReviewItem
                        label="Acceso"
                        value={
                          formData.eventPricing === "free"
                            ? "Gratuito"
                            : "De pago"
                        }
                      />
                      <ReviewItem
                        label="Precio de entrada"
                        value={formData.ticketPrice}
                      />
                      <ReviewItem
                        label="Enlace de entradas"
                        value={formData.ticketUrl}
                      />
                      <ReviewItem
                        label="Público recomendado"
                        value={formData.recommendedAudience}
                      />
                      <ReviewItem
                        label="Restricción de edad"
                        value={formData.ageRestriction}
                      />
                      <ReviewItem
                        label="Cupos limitados"
                        value={yesNoLabel(formData.limitedCapacity)}
                      />
                      <ReviewItem
                        label="Estacionamiento"
                        value={yesNoLabel(formData.parking)}
                      />
                      <ReviewItem
                        label="Acceso para personas con discapacidad"
                        value={yesNoLabel(formData.accessibility)}
                      />
                    </ReviewSection>
                  )}

                  {formData.type !== "evento" && (
                    <ReviewSection title="Facturación y pagos">
                      <ReviewItem
                        label="Factura legal"
                        value={invoiceLabel(formData.invoiceStatus)}
                      />
                      <ReviewItem
                        label="Medios de pago"
                        value={formData.paymentMethods
                          .map(
                            (method) =>
                              paymentOptions.find(
                                (option) => option.value === method,
                              )?.label ?? method,
                          )
                          .join(", ")}
                      />
                    </ReviewSection>
                  )}
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-2xl bg-blue-50/70 p-4">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm leading-6 text-text-secondary">
                    Al publicar, Austro validará la información. Si no detecta
                    observaciones se mostrará en Explorar; si requiere una
                    comprobación adicional, pasará a revisión.
                  </p>
                </div>
              </div>
            )}

            {draftMessage && (
              <div
                role="status"
                className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4"
              >
                <Save className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <p className="text-xs leading-5 text-emerald-800">
                  {draftMessage}
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 4) {
                      setStep(1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      return;
                    }
                    goBack();
                  }}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-surface-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {step === 4 ? "Volver a editar" : "Volver"}
                </button>
              ) : (
                <Link
                  href="/"
                  className="inline-flex min-h-12 items-center justify-center px-2 text-sm font-semibold text-text-secondary transition-colors hover:text-primary"
                >
                  Cancelar
                </Link>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-surface-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Save className="h-4 w-4" />
                  Guardar borrador
                </button>

                {step < 4 ? (
                  <button
                    key="continue-button"
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      goForward();
                    }}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    key="publish-button"
                    type="submit"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    Publicar
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-5 lg:sticky lg:top-6">
          <div className="hidden lg:block">
            <AssistantLauncher onOpen={() => setHelpOpen(true)} />
          </div>

          <aside className="rounded-3xl bg-primary p-6 text-white shadow-[0_22px_60px_rgba(29,78,216,0.18)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-xl font-bold">Publicaciones confiables</h2>
            <p className="mt-3 text-sm leading-6 text-white/75">
              Revisamos la información básica antes de mostrarla públicamente
              para proteger la calidad del directorio.
            </p>

            <ul className="mt-6 space-y-4 text-sm text-white/85">
              {[
                "Usa datos reales y verificables.",
                "Describe claramente tu propuesta.",
                "Evita imágenes con información sensible.",
                "Mantén los datos de contacto actualizados.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="leading-5">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 border-t border-white/15 pt-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-white">
                <MapPin className="h-4 w-4" />
                Coronel Oviedo
              </p>
              <p className="mt-2 text-xs leading-5 text-white/65">
                Austro inicia como un directorio enfocado en la comunidad local.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-help-title"
        >
          <button
            type="button"
            aria-label="Cerrar asistente"
            onClick={() => setHelpOpen(false)}
            className="absolute inset-0 cursor-default"
          />

          <aside className="relative flex h-full w-full max-w-md flex-col bg-surface shadow-[-24px_0_70px_rgba(11,31,51,0.18)]">
            <header className="border-b border-border bg-primary p-5 text-white sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white/12">
                    <UserRound className="h-5 w-5" />
                    <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-cyan-300" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white/70">
                      Asistente guiado de Austro
                    </p>
                    <h2 id="publish-help-title" className="text-lg font-bold">
                      Te ayudo a publicar
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHelpOpen(false)}
                  aria-label="Cerrar"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition-colors hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-medium text-white/75">
                  <span>Avance de la conversación</span>
                  <span>
                    {Math.min(
                      helpMessages.filter((message) => message.role === "user")
                        .length + 1,
                      6,
                    )}
                    /6
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{
                      width: `${Math.min(
                        ((helpMessages.filter(
                          (message) => message.role === "user",
                        ).length +
                          1) /
                          6) *
                          100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto bg-surface-soft/45 p-5">
              <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs leading-5 text-text-secondary">
                  Responde hablando o escribiendo. Nada se publicará sin que
                  primero revises y confirmes todos los datos.
                </p>
              </div>

              {helpMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <p
                    className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "rounded-br-md bg-primary text-white"
                        : "rounded-bl-md border border-border bg-surface text-foreground"
                    }`}
                  >
                    {message.content}
                  </p>
                </div>
              ))}

              {helpMessages.filter((message) => message.role === "user")
                .length === 0 && (
                <div className="flex flex-wrap gap-2">
                  {publicationTypes.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => chooseHelpType(option.value, option.label)}
                      className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border bg-surface p-4 sm:p-5">
              <form
                onSubmit={handleHelpSubmit}
                className="flex items-end gap-2"
              >
                <div className="min-w-0 flex-1">
                  <label htmlFor="publish-help-input" className="sr-only">
                    Escribe tu respuesta
                  </label>
                  <textarea
                    id="publish-help-input"
                    rows={2}
                    value={helpInput}
                    onChange={(event) => setHelpInput(event.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-5 text-foreground outline-none placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>
                <button
                  type="button"
                  aria-label="Responder por voz"
                  title="La entrada por voz se conectará con el asistente de IA"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border text-primary transition-colors hover:bg-blue-50"
                >
                  <Mic className="h-5 w-5" />
                </button>
                <button
                  type="submit"
                  aria-label="Enviar respuesta"
                  disabled={!helpInput.trim()}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[11px] leading-4 text-text-secondary">
                  Voz e interpretación inteligente se conectarán en la etapa de
                  backend.
                </p>
                <button
                  type="button"
                  onClick={() => setHelpOpen(false)}
                  className="shrink-0 text-xs font-bold text-primary hover:underline"
                >
                  Ver formulario
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
