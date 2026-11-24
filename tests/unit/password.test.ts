import { hashPassword, verifyPassword } from "@/lib/password";

describe("password hashing", () => {
  it("never stores the plain password and verifies correctly", async () => {
    const hash = await hashPassword("Secret123");
    expect(hash).not.toContain("Secret123");
    expect(hash).toMatch(/^\$2[aby]\$/);
    await expect(verifyPassword("Secret123", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong", hash)).resolves.toBe(false);
  });

  it("produces different hashes for the same password (salted)", async () => {
    expect(await hashPassword("Secret123")).not.toEqual(await hashPassword("Secret123"));
  });
});
