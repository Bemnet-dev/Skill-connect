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
 * API endpoint to send a "login success" message via Telegram.
 * Called by the auth flow after successful OTP verification.
 */
export async function POST(request: NextRequest) {
  try {
    const internalSecret = request.headers.get("x-internal-secret");
    if (internalSecret !== env.INTERNAL_REVALIDATE_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber, userName, role } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Missing phoneNumber" },
        { status: 400 }
      );
    }

    const db = getPool();
    const result = await db.query(
      `SELECT telegram_user_id, language 
       FROM telegram_user_mappings 
       WHERE phone_number = $1 AND expires_at > NOW()
       ORDER BY updated_at DESC 
       LIMIT 1`,
      [phoneNumber]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: true, message: "No mapping found" });
    }

    const row = result.rows[0];
    const telegramUserId = parseInt(row.telegram_user_id);
    const language = row.language || "en";

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: "Telegram bot not configured" },
        { status: 500 }
      );
    }

    const isAmharic = language === "am";
    const roleDisplay = role === "worker" || role === "expert"
      ? (isAmharic ? "ባለሞያ" : "Expert")
      : (isAmharic ? "ደንበኛ" : "Customer");

    const message = isAmharic
      ? `✅ እንኳን ደህና ገቡ! ${userName || "User"} እንደ ${roleDisplay} ተመዝግበዋል።`
      : `✅ Welcome back! ${userName || "User"} is now logged in as ${roleDisplay}.`;

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramUserId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    const telegramResult = await telegramResponse.json();

    if (!telegramResult.ok) {
      console.error("Failed to send Telegram message:", telegramResult);
      return NextResponse.json(
        { error: "Failed to send Telegram message", details: telegramResult },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending login success via Telegram:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
