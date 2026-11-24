// Edge-safe role constants (no Prisma import so middleware can use them).
export const ROLES = ["CLIENT", "MANAGER", "FOLLOW_UP_AGENT", "PAYMENT_AGENT"] as const;
export type RoleName = (typeof ROLES)[number];

export const AGENT_ROLES = ["FOLLOW_UP_AGENT", "PAYMENT_AGENT"] as const;

export const CLIENT_TYPES = ["STUDENT", "HIGH_SCHOOL_STUDENT", "DEVELOPER", "ENTREPRENEUR"] as const;
export const ROOM_TYPES = ["INDIVIDUAL", "MULTI_PERSON", "MEETING", "TRAINING"] as const;

/** Landing page for each role after login. */
export const ROLE_HOME: Record<RoleName, string> = {
  CLIENT: "/client/availability",
  MANAGER: "/manager",
  FOLLOW_UP_AGENT: "/agent/planning",
  PAYMENT_AGENT: "/agent/payments",
};

/** Protected path prefixes and the roles allowed to access them (pages and APIs). */
const PROTECTED: { prefix: string; roles: readonly RoleName[] }[] = [
  { prefix: "/client", roles: ["CLIENT"] },
  { prefix: "/manager", roles: ["MANAGER"] },
  { prefix: "/api/manager", roles: ["MANAGER"] },
  { prefix: "/agent/planning", roles: ["FOLLOW_UP_AGENT"] },
  { prefix: "/agent/payments", roles: ["PAYMENT_AGENT"] },
  { prefix: "/api/availability", roles: ["CLIENT"] },
];

function matches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

/** Roles allowed on a path, or null when the path is public. */
export function allowedRolesFor(pathname: string): readonly RoleName[] | null {
  const rule = PROTECTED.find((r) => matches(pathname, r.prefix));
  return rule ? rule.roles : null;
}

export function canAccess(pathname: string, role: RoleName | null | undefined): boolean {
  const roles = allowedRolesFor(pathname);
  if (!roles) return true;
  return !!role && roles.includes(role);
}

export const ROLE_LABELS: Record<RoleName, string> = {
  CLIENT: "Client",
  MANAGER: "Gérant",
  FOLLOW_UP_AGENT: "Agent de suivi",
  PAYMENT_AGENT: "Agent de paiement",
};

export const CLIENT_TYPE_LABELS: Record<(typeof CLIENT_TYPES)[number], string> = {
  STUDENT: "Étudiant",
  HIGH_SCHOOL_STUDENT: "Élève",
  DEVELOPER: "Développeur",
  ENTREPRENEUR: "Entrepreneur",
};

export const ROOM_TYPE_LABELS: Record<(typeof ROOM_TYPES)[number], string> = {
  INDIVIDUAL: "Individuelle",
  MULTI_PERSON: "Multi-personnes",
  MEETING: "Réunion",
  TRAINING: "Formation",
};
