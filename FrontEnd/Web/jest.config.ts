import nextJest from "next/jest.js";
const createJestConfig = nextJest({ dir: "./" });
export default createJestConfig({
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testPathIgnorePatterns: ["<rootDir>/tests/e2e/"],
});
