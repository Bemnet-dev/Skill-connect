import { NextRequest, NextResponse } from "next/server";
import { findTelegramChatIdForPhone, sendTelegramDirectMessage } from "@/lib/telegram-server";

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, userName, role } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "phoneNumber is required" },
        { status: 400 }
      );
    }

    const userChatId = await findTelegramChatIdForPhone(phoneNumber).catch(() => null);
    
    if (!userChatId) {
      return NextResponse.json(
        { success: true, message: "No linked Telegram account found" },
        { status: 200 }
      );
    }

    const roleLabel = role === "worker" ? "Expert 🛠" : "Client 👤";
    
    await sendTelegramDirectMessage(
      userChatId,
      `✅ <b>Successfully Logged In!</b>\n\n` +
      `👋 Welcome back, <b>${userName || "User"}</b>!\n` +
      `📱 Phone: <code>${phoneNumber}</code>\n` +
      `🎭 Role: <b>${roleLabel}</b>\n\n` +
      `You are now signed in to SkillConnect.`
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API] Failed to send login success Telegram message:", err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}