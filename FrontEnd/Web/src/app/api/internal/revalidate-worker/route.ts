import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Worker Profile On-Demand ISR Revalidation Route (SC-FE-003 §5.1)
 * ─────────────────────────────────────────────────────────────────────────────
 * Dev A Domain (Worker Profile & Discovery ISR Cache).
 *
 * Internal webhook endpoint triggered by backend services when a worker
 * updates their profile, headline, skills, rates, availability, or portfolio.
 * Evicts stale static pages and cache tags from the Next.js edge ISR cache
 * so subsequent visitor requests receive freshly rendered profile data.
 *
 * Auth:
 * - Header `x-revalidation-secret` or `Authorization: Bearer <secret>`
 * - Body or query parameter `secret`
 *
 * Target Paths & Tags:
 * - Path: `/workers/[id]`
 * - Tag: `worker-[id]`
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const REVALIDATION_SECRET =
  process.env.REVALIDATION_SECRET ||
  process.env.INTERNAL_API_SECRET ||
  "development-internal-revalidation-secret";

/**
 * Validates request authorization secret against environment configuration.
 */
function isAuthorized(request: NextRequest, bodySecret?: string): boolean {
  // 1. Check custom internal secret header
  const headerSecret = request.headers.get("x-revalidation-secret");
  if (headerSecret && headerSecret === REVALIDATION_SECRET) {
    return true;
  }

  // 2. Check Bearer token authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    if (bearerToken === REVALIDATION_SECRET) {
      return true;
    }
  }

  // 3. Check query param secret
  const querySecret = request.nextUrl.searchParams.get("secret");
  if (querySecret && querySecret === REVALIDATION_SECRET) {
    return true;
  }

  // 4. Check JSON payload secret
  if (bodySecret && bodySecret === REVALIDATION_SECRET) {
    return true;
  }

  return false;
}

/**
 * POST /api/internal/revalidate-worker
 * Revalidates a specific worker's profile ISR cache via JSON payload or headers.
 *
 * @example
 * ```bash
 * curl -X POST https://skillconnect.com/api/internal/revalidate-worker \
 *   -H "Content-Type: application/json" \
 *   -H "x-revalidation-secret: secret" \
 *   -d '{"workerId": "wkr_123"}'
 * ```
 */
export async function POST(request: NextRequest) {
  let workerId: string | undefined;
  let bodySecret: string | undefined;

  try {
    const body = await request.json();
    if (body && typeof body === "object") {
      workerId = typeof body.workerId === "string" ? body.workerId.trim() : undefined;
      bodySecret = typeof body.secret === "string" ? body.secret.trim() : undefined;
    }
  } catch {
    // Body is either empty or not valid JSON; fallback to query parameters
    workerId = request.nextUrl.searchParams.get("workerId")?.trim() || undefined;
  }

  // Authorize request
  if (!isAuthorized(request, bodySecret)) {
    return NextResponse.json(
      {
        revalidated: false,
        error: "Unauthorized: Invalid or missing revalidation secret",
      },
      { status: 401 }
    );
  }

  // Validate required workerId
  if (!workerId) {
    return NextResponse.json(
      {
        revalidated: false,
        error: "Bad Request: 'workerId' parameter is required to revalidate worker profile",
      },
      { status: 400 }
    );
  }

  const profilePath = `/workers/${workerId}`;
  const workerTag = `worker-${workerId}`;

  try {
    // 1. Purge specific worker profile page from ISR cache
    revalidatePath(profilePath, "page");

    // 2. Invalidate cache tags associated with worker data fetch
    revalidateTag(workerTag, "default");

    return NextResponse.json(
      {
        revalidated: true,
        workerId,
        paths: [profilePath],
        tags: [workerTag],
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[ISR Revalidation Error] Failed to revalidate worker ${workerId}:`, error);
    return NextResponse.json(
      {
        revalidated: false,
        workerId,
        error: "Internal Server Error during ISR cache invalidation",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/internal/revalidate-worker?workerId=wkr_123&secret=...
 * Supports lightweight HTTP GET webhook callbacks for ISR cache busting.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        revalidated: false,
        error: "Unauthorized: Invalid or missing revalidation secret",
      },
      { status: 401 }
    );
  }

  const workerId = request.nextUrl.searchParams.get("workerId")?.trim();

  if (!workerId) {
    return NextResponse.json(
      {
        revalidated: false,
        error: "Bad Request: 'workerId' query parameter is required",
      },
      { status: 400 }
    );
  }

  const profilePath = `/workers/${workerId}`;
  const workerTag = `worker-${workerId}`;

  try {
    revalidatePath(profilePath, "page");
    revalidateTag(workerTag, "default");

    return NextResponse.json(
      {
        revalidated: true,
        workerId,
        paths: [profilePath],
        tags: [workerTag],
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[ISR Revalidation Error] Failed to revalidate worker ${workerId}:`, error);
    return NextResponse.json(
      {
        revalidated: false,
        workerId,
        error: "Internal Server Error during ISR cache invalidation",
      },
      { status: 500 }
    );
  }
}
