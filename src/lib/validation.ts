import { format, isValid, parse } from "date-fns";
import { z } from "zod";
import { AGENT_ROLES, CLIENT_TYPES, ROOM_TYPES } from "./roles";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const emailSchema = z
  .string({ required_error: "L'email est requis." })
  .trim()
  .toLowerCase()
  .min(1, "L'email est requis.")
  .max(254, "Email trop long.")
  .email("Adresse email invalide.");

export const passwordSchema = z
  .string({ required_error: "Le mot de passe est requis." })
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  .max(128, "Le mot de passe est trop long.")
  .regex(/[a-z]/, "Le mot de passe doit contenir une minuscule.")
  .regex(/[A-Z]/, "Le mot de passe doit contenir une majuscule.")
  .regex(/\d/, "Le mot de passe doit contenir un chiffre.");

const fullNameSchema = z
  .string({ required_error: "Le nom complet est requis." })
  .trim()
  .min(2, "Le nom complet doit contenir au moins 2 caractères.")
  .max(100, "Le nom complet est trop long.");

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string({ required_error: "Confirmez le mot de passe." }),
    clientType: z.enum(CLIENT_TYPES, {
      errorMap: () => ({ message: "Choisissez un profil valide." }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: "Le mot de passe est requis." }).min(1, "Le mot de passe est requis."),
});

export const createAgentSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  role: z.enum(AGENT_ROLES, {
    errorMap: () => ({ message: "Le rôle doit être agent de suivi ou agent de paiement." }),
  }),
  temporaryPassword: passwordSchema,
});

const equipmentSchema = z
  .union([z.array(z.string()), z.string()])
  .default([])
  .transform((v) => (Array.isArray(v) ? v : v.split(",")))
  .transform((arr) => Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean))))
  .pipe(
    z
      .array(z.string().max(40, "Un équipement est trop long (40 caractères max)."))
      .max(20, "20 équipements maximum."),
  );

export const roomSchema = z.object({
  name: z
    .string({ required_error: "Le nom est requis." })
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(80, "Le nom est trop long."),
  type: z.enum(ROOM_TYPES, { errorMap: () => ({ message: "Type de salle invalide." }) }),
  capacity: z.coerce
    .number({ invalid_type_error: "La capacité doit être un nombre." })
    .int("La capacité doit être un nombre entier.")
    .min(1, "La capacité doit être d'au moins 1 personne.")
    .max(500, "La capacité ne peut pas dépasser 500 personnes."),
  equipment: equipmentSchema,
});

export const roomUpdateSchema = roomSchema.partial();

const timeSchema = (label: string) =>
  z.string({ required_error: `${label} est requise.` }).regex(TIME_RE, `${label} doit être au format HH:mm.`);

export const settingsSchema = z
  .object({
    openingTime: timeSchema("L'heure d'ouverture"),
    closingTime: timeSchema("L'heure de fermeture"),
    maxDurationMinutes: z.coerce
      .number({ invalid_type_error: "La durée maximale doit être un nombre." })
      .int("La durée maximale doit être un nombre entier.")
      .positive("La durée maximale doit être positive.")
      .max(1440, "La durée maximale ne peut pas dépasser 24h."),
    bufferMinutes: z.coerce
      .number({ invalid_type_error: "Le temps tampon doit être un nombre." })
      .int("Le temps tampon doit être un nombre entier.")
      .min(0, "Le temps tampon ne peut pas être négatif.")
      .max(240, "Le temps tampon ne peut pas dépasser 240 minutes."),
  })
  .refine((s) => s.openingTime < s.closingTime, {
    message: "L'heure d'ouverture doit être avant l'heure de fermeture.",
    path: ["closingTime"],
  });

export const availabilityQuerySchema = z.object({
  date: z
    .string({ required_error: "La date est requise." })
    .regex(DATE_RE, "La date doit être au format AAAA-MM-JJ.")
    .refine((d) => {
      const parsed = parse(d, "yyyy-MM-dd", new Date());
      return isValid(parsed) && format(parsed, "yyyy-MM-dd") === d;
    }, "Date invalide."),
  startTime: timeSchema("L'heure de début"),
  durationMinutes: z.coerce
    .number({ invalid_type_error: "La durée doit être un nombre." })
    .int("La durée doit être un nombre entier de minutes.")
    .positive("La durée doit être supérieure à 0."),
  participants: z.coerce
    .number({ invalid_type_error: "Le nombre de personnes doit être un nombre." })
    .int("Le nombre de personnes doit être un entier.")
    .positive("Le nombre de personnes doit être supérieur à 0."),
});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type RoomInput = z.infer<typeof roomSchema>;
