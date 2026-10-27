/** Tipos compartidos entre API y cliente. */

export type ProType = "DOCTOR" | "NURSE";
export type LocationStatus = "live" | "stale" | "none";

export type LocalizedName = { fr: string; ar: string };

export type ZoneDTO = {
  id: number;
  nameFr: string;
  nameAr: string;
  centerLat: number;
  centerLng: number;
  polygon: GeoJSON.Polygon;
};

export type SpecialtyDTO = {
  id: number;
  type: ProType;
  nameFr: string;
  nameAr: string;
};

/** Datos de la tarjeta (mapa del admin). */
export type ProfessionalCardDTO = {
  id: string;
  type: ProType;
  firstName: string;
  lastName: string;
  photoUrl: string;
  phone: string;
  whatsapp: string | null;
  specialtyId: number;
  specialty: LocalizedName;
  languages: string[];
  hasVehicle: boolean;
  yearsExperience: number;
  isAvailable: boolean;
  /** Posición mostrada: real o, si no hay, cerca del centro de la zona habitual. */
  lat: number;
  lng: number;
  locationStatus: LocationStatus;
  locationUpdatedAt: string | null;
  /** La posición la indicó el profesional a mano (no el GPS). */
  locationManual: boolean;
  zoneId: number;
  zone: { fr: string; ar: string };
};

/** Ficha completa. */
export type ProfessionalDetailDTO = ProfessionalCardDTO & {
  birthDate: string;
  sex: "MALE" | "FEMALE";
  nni: string;
  email: string | null;
  workplace: string;
  bio: string;
  homeZoneId: number;
  homeZone: { fr: string; ar: string };
  availableSince: string | null;
  createdAt: string;
};

export type ProfessionalsPage = {
  items: ProfessionalDetailDTO[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
};

/** Perfil propio (panel del profesional). */
export type MeDTO = ProfessionalDetailDTO & {
  realLat: number | null;
  realLng: number | null;
  currentZoneId: number | null;
};
