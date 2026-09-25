process.env.NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';
process.env.NEXT_PUBLIC_SIGNALR_HUB_URL = process.env.NEXT_PUBLIC_SIGNALR_HUB_URL || 'http://localhost:5001/hubs/realtime';

import nextJest from "next/jest.js";
const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testPathIgnorePatterns: ["<rootDir>/tests/e2e/"],
};

const jestConfig = async () => {
  const config = await createJestConfig(customJestConfig)();
  config.moduleNameMapper = {
    ...config.moduleNameMapper,
    "^@/(.*)$": "<rootDir>/src/$1",
  };
  config.transformIgnorePatterns = [
    "[\\\\/]node_modules[\\\\/](?!(@better-auth|better-auth|nanostores|better-call|better-fetch)[\\\\/])",
  ];
  return config;
};

export default jestConfig;

