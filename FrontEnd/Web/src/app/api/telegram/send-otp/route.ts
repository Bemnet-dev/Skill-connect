import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";

/**
 * API endpoint for sending OTP via Telegram
 * Called by the backend Telegram bot after requesting OTP from Better Auth
 */
export async function POST(request: NextRequest) {
  try {
    const internalSecret = request.headers.get("x-internal-secret");
    if (internalSecret !== env.INTERNAL_REVALIDATE_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber, code, telegramUserId, language = "en" } = body;

    if (!phoneNumber || !code || !telegramUserId) {
      return NextResponse.json(
        { error: "Missing required fields: phoneNumber, code, telegramUserId" },
        { status: 400 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: "Telegram bot not configured" },
        { status: 500 }
      );
    }

    const isAmharic = language === "am";
    const message = isAmharic
      ? `🔐 የደህንነት ኮድዎ: <b>${code}</b>\n\nይህ ኮድ 5 ደቂቃ ያለበት ነው። ለማናገር ማንም አያሳይበትም።`
      : `🔐 Your verification code: <b>${code}</b>\n\nThis code expires in 5 minutes. Do not share it with anyone.`;

    // Send message via Telegram Bot API
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
    console.error("Error sending OTP via Telegram:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
