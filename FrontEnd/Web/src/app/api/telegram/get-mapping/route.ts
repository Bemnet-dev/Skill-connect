import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { env } from "@/env";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: env.DATABASE_URL });
  }
  return pool;
}

/**
 * API endpoint to get Telegram user mapping by phone number
 * Called by Better Auth when sending OTP
 */
export async function POST(request: NextRequest) {
  try {
    const internalSecret = request.headers.get("x-internal-secret");
    if (internalSecret !== env.INTERNAL_REVALIDATE_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Missing phoneNumber" },
        { status: 400 }
      );
    }

    const db = getPool();
    const result = await db.query(
      `SELECT telegram_user_id, language, role 
       FROM telegram_user_mappings 
       WHERE phone_number = $1 AND expires_at > NOW()
       ORDER BY updated_at DESC 
       LIMIT 1`,
      [phoneNumber]
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return NextResponse.json({
        telegramUserId: parseInt(row.telegram_user_id),
        language: row.language || "en",
        role: row.role || "customer",
      });
    }

    return NextResponse.json({});
  } catch (error) {
    console.error("Error getting Telegram mapping:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
