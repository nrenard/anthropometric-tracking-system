import "@testing-library/jest-dom/vitest"

process.env.AUTH_USER ??= "test@example.com"
process.env.AUTH_PASSWORD_HASH ??= "test-hash"
process.env.MONGODB_URI ??= "mongodb://localhost:27017/test"
