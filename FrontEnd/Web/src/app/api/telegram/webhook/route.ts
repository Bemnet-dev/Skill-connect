import { NextRequest, NextResponse } from "next/server";
import { handleTelegramUpdate, getTelegramBotUsername } from "@/lib/telegram-bot";
import { env } from "@/env";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Telegram Bot Webhook Route (/api/telegram/webhook)
 * ─────────────────────────────────────────────────────────────────────────────
 * Receives update payloads from Telegram servers when users:
 * - Start the bot (/start)
 * - Select their role (Expert vs Client)
 * - Share their phone contact via Telegram button
 * - Request a fresh login OTP (/otp)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    if (!update || typeof update !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    const result = await handleTelegramUpdate(update);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("[Telegram Webhook Error]:", error);
    // Return 200 to Telegram so it does not endlessly retry failed updates
    return NextResponse.json({ ok: true, error: "Internal processing error" }, { status: 200 });
  }
}

export async function GET() {
  const username = getTelegramBotUsername();
  return NextResponse.json({
    status: "online",
    botUsername: username,
    botUrl: `https://t.me/${username}`,
    timestamp: new Date().toISOString(),
  });
}
