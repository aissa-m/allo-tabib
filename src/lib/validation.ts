import { z } from "zod";
import { LANGUAGES } from "./constants";
import { MR_PHONE_REGEX, normalizePhone } from "./phone";

/**
 * Esquemas compartidos entre cliente y servidor.
 * Los mensajes de error son claves de traducción dentro de "errors" (messages/*.json).
 */

const phone = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((v) => MR_PHONE_REGEX.test(v), "phone");

const optionalPhone = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? normalizePhone(v) : ""))
  .refine((v) => v === "" || MR_PHONE_REGEX.test(v), "phone");

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .optional()
  .transform((v) => v ?? "")
  .refine((v) => v === "" || z.string().email().safeParse(v).success, "email");

export const passwordSchema = z
  .string()
  .min(8, "passwordMin")
  .max(100, "tooLong");

const birthDate = z
  .string()
  .min(1, "required")
  .refine((v) => !Number.isNaN(Date.parse(v)), "date")
  .refine((v) => {
    const age = (Date.now() - Date.parse(v)) / (365.25 * 24 * 3600 * 1000);
    return age >= 21 && age <= 90;
  }, "age");

export const typeSchema = z.enum(["DOCTOR", "NURSE"], { message: "required" });

export const stepTypeSchema = z.object({ type: typeSchema });

export const stepPersonalSchema = z.object({
  firstName: z.string().trim().min(2, "required").max(60, "tooLong"),
  lastName: z.string().trim().min(2, "required").max(60, "tooLong"),
  birthDate,
  sex: z.enum(["MALE", "FEMALE"], { message: "required" }),
  nni: z.string().trim().regex(/^\d{10}$/, "nni"),
});

export const stepContactSchema = z.object({
  phone,
  whatsappSame: z.boolean(),
  whatsapp: optionalPhone,
  email: optionalEmail,
});

export const stepProfessionalSchema = z.object({
  specialtyId: z.coerce.number({ message: "required" }).int().positive("required"),
  yearsExperience: z.coerce.number({ message: "number" }).int("number").min(0, "number").max(60, "number"),
  workplace: z.string().trim().max(120, "tooLong").default(""),
  languages: z.array(z.enum(LANGUAGES)).min(1, "languages").max(LANGUAGES.length, "languages"),
  bio: z.string().trim().max(300, "bioMax").default(""),
});

export const stepZoneSchema = z.object({
  homeZoneId: z.coerce.number({ message: "required" }).int().positive("required"),
  hasVehicle: z.boolean(),
});

export const stepAccessSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "passwordMatch", path: ["confirmPassword"] });

const baseRegister = stepTypeSchema
  .merge(stepPersonalSchema)
  .merge(stepContactSchema)
  .merge(stepProfessionalSchema)
  .merge(stepZoneSchema);

export const registerSchema = baseRegister
  .extend({ password: passwordSchema, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { message: "passwordMatch", path: ["confirmPassword"] });

export type RegisterInput = z.input<typeof registerSchema>;
export type RegisterData = z.output<typeof registerSchema>;

/** Edición de perfil: mismos campos que el registro salvo tipo, contraseña y foto. */
export const profileUpdateSchema = stepPersonalSchema
  .merge(stepContactSchema)
  .merge(stepProfessionalSchema)
  .merge(stepZoneSchema);
export type ProfileUpdateInput = z.input<typeof profileUpdateSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: "passwordMatch", path: ["confirmPassword"] });
export type PasswordChangeInput = z.input<typeof passwordChangeSchema>;

export const loginSchema = z.object({
  // Solo el prefijo "+222" (sin número) cuenta como vacío
  identifier: z.string().trim().min(3, "required").max(120, "tooLong").refine((v) => v.replace(/[\s+]/g, "") !== "222", "required"),
  password: z.string().min(1, "required").max(100, "tooLong"),
});
export type LoginInput = z.input<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "required").max(120, "tooLong").email("email"),
});
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().regex(/^[A-Za-z0-9_-]{43}$/, "resetInvalid"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "passwordMatch", path: ["confirmPassword"] });
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;

export const availabilitySchema = z.object({ available: z.boolean() });

export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(100000).default(0),
  /** true: posición indicada a mano en el mapa (sin GPS). */
  manual: z.boolean().default(false),
});

const boolParam = z
  .enum(["true", "false", "1", "0", ""])
  .optional()
  .transform((v) => (v === "true" || v === "1" ? true : v === "false" || v === "0" ? false : undefined));

const csvInts = z
  .string()
  .max(200)
  .optional()
  .transform((v) => (v ? v.split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0) : []));

export const availableQuerySchema = z.object({
  zone: z.coerce.number().int().positive().optional(),
  type: z.enum(["DOCTOR", "NURSE"]).optional(),
  specialty: csvInts,
  lang: z.enum(LANGUAGES).optional(),
  vehicle: boolParam,
  bbox: z.string().optional(),
  /** Incluir también a los no disponibles (mapa del admin). */
  all: boolParam,
});

export const professionalsQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  type: z.enum(["DOCTOR", "NURSE"]).optional(),
  specialty: csvInts,
  zone: z.coerce.number().int().positive().optional(),
  available: boolParam,
  page: z.coerce.number().int().min(1).default(1),
  sort: z.enum(["name", "recent", "availability"]).default("availability"),
});

/** Convierte los parámetros de URL en objeto, descartando vacíos. */
export function searchParamsToObject(params: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  params.forEach((value, key) => {
    if (value !== "") out[key] = value;
  });
  return out;
}
