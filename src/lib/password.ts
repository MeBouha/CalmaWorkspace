import bcrypt from "bcryptjs";

// 12 rounds in dev/prod (requirement: >= 10). Tests use 4 rounds to stay fast.
export const BCRYPT_ROUNDS = process.env.NODE_ENV === "test" ? 4 : 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
