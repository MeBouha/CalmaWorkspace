// Runs before each test file: point Prisma at a dedicated test database.
process.env.DATABASE_URL = "file:./test.db";
process.env.JWT_SECRET = "test-secret-test-secret-test-secret-123456";
