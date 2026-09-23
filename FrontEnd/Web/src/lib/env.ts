import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /**
   * Server-side environment variables
   * Not available on the client, will throw if accessed
   */
  server: {
    // Add server-only vars here if needed in future
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  },
  
  /**
   * Client-side environment variables
   * Must be prefixed with NEXT_PUBLIC_
   */
  client: {
    NEXT_PUBLIC_API_BASE_URL: z.string().url(),
    NEXT_PUBLIC_SIGNALR_HUB_URL: z.string().url(),
    NEXT_PUBLIC_MAPS_PROVIDER_KEY: z.string().optional(),
    NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default('en'),
  },
  
  /**
   * Runtime environment mapping
   * Destructure all client variables explicitly
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_SIGNALR_HUB_URL: process.env.NEXT_PUBLIC_SIGNALR_HUB_URL,
    NEXT_PUBLIC_MAPS_PROVIDER_KEY: process.env.NEXT_PUBLIC_MAPS_PROVIDER_KEY,
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
  },
  
  /**
   * Skip validation in some build scenarios
   * NEVER skip in production builds
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
