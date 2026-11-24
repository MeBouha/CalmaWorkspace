import type { User } from "@prisma/client";

/** Public user shape — never includes passwordHash. */
export type UserDTO = Omit<User, "passwordHash" | "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export function toUserDTO(user: User): UserDTO {
  const { passwordHash: _passwordHash, ...rest } = user;
  return { ...rest, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() };
}

export const publicUserSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  clientType: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;
