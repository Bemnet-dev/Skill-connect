import { env } from "@/env";
import {
  normalizeEthiopianPhone,
  findTelegramChatIdForPhone,
  findTelegramUserByChatId,
  sendTelegramDirectMessage,
  upsertTelegramUser,
  generateLoginOtpForPhone,
  answerCallbackQuery,
} from "@/lib/telegram-server";

export interface TelegramUserRecord {
  id: number;
  phone_number: string;
  telegram_chat_id: string;
  telegram_user_id?: string | null;
  telegram_username?: string | null;
  role: "customer" | "worker";
  created_at: Date;
  updated_at: Date;
}

export interface TelegramContact {
  phone_number: string;
  first_name?: string;
  last_name?: string;
  user_id?: number;
}

export interface TelegramChat {
  id: number;
  type: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

export interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  contact?: TelegramContact;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

/**
 * In-memory pending roles cache for interactive session tracking during onboarding
 */
const pendingRolesCache = new Map<string, "customer" | "worker">();

export function setPendingRole(chatId: string | number, role: "customer" | "worker"): void {
  pendingRolesCache.set(String(chatId), role);
}

export function getPendingRole(chatId: string | number): "customer" | "worker" | null {
  return pendingRolesCache.get(String(chatId)) || null;
}

/**
 * Returns configured bot username (default: 'skillconnect_dev_bot')
 */
export function getTelegramBotUsername(): string {
  return env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "skillconnect_dev_bot";
}

/**
 * Handles incoming updates from the Telegram bot (webhook or polling)
 */
export async function handleTelegramUpdate(update: TelegramUpdate): Promise<{
  handled: boolean;
  action?: string;
  message?: string;
}> {
  const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // ── 1. Handle Callback Queries (Role selection clicks) ─────────────────────
  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = cb.message?.chat.id || cb.from.id;
    const data = cb.data || "";

    if (data === "role_worker" || data === "role_customer") {
      const selectedRole = data === "role_worker" ? "worker" : "customer";
      setPendingRole(chatId, selectedRole);

      await answerCallbackQuery(cb.id, `Selected: ${selectedRole === "worker" ? "Expert" : "Client"}`);

      const roleTitle = selectedRole === "worker" ? "🛠 Expert / Worker (ባለሙያ)" : "👤 Client (አሰሪ)";
      const promptText =
        `Great! You are registering as <b>${roleTitle}</b>.\n\n` +
        `To complete your registration and receive your web login codes, please share your phone number using the button below:`;

      await sendTelegramDirectMessage(chatId, promptText, {
        reply_markup: {
          keyboard: [
            [
              {
                text: "📱 Share Phone Number (ስልክ ቁጥርዎን ያጋሩ)",
                request_contact: true,
              },
            ],
            [{ text: "❌ Cancel" }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });

      return { handled: true, action: "role_selected" };
    }

    if (data === "request_otp") {
      await answerCallbackQuery(cb.id, "Generating login code...");
      const existing = await findTelegramUserByChatId(chatId);
      if (existing) {
        const { code } = await generateLoginOtpForPhone(existing.phone_number);
        const encodedPhone = encodeURIComponent(existing.phone_number);
        const loginUrl = `${appUrl}/verify-otp?phone=${encodedPhone}&code=${code}`;

        await sendTelegramDirectMessage(
          chatId,
          `🔐 <b>SkillConnect Login Code</b>\n\n` +
          `Your verification code: <b>${code}</b>\n\n` +
          `📱 Phone: <code>${existing.phone_number}</code>\n` +
          `🎭 Role: <b>${existing.role === "worker" ? "Expert" : "Client"}</b>\n` +
          `⏱ Expires in 5 minutes.\n\n` +
          `👉 <a href="${loginUrl}"><b>Tap here to sign in to SkillConnect</b></a>`
        );
        return { handled: true, action: "otp_sent" };
      }
    }
  }

  // ── 2. Handle Messages ────────────────────────────────────────────────────
  if (update.message) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const text = msg.text?.trim() || "";

    // 2.1 Native Contact Sharing
    if (msg.contact) {
      const contactPhone = msg.contact.phone_number;
      const pendingRole = getPendingRole(chatId) || "customer";

      const record = await upsertTelegramUser({
        phoneNumber: contactPhone,
        telegramChatId: String(chatId),
        telegramUserId: String(msg.from?.id || msg.contact.user_id || ""),
        telegramUsername: msg.from?.username,
        role: pendingRole,
      });

      const roleDisplay = record.role === "worker" ? "🛠 Expert / Worker (ባለሙያ)" : "👤 Client (አሰሪ)";
      const successMsg =
        `✅ <b>Registration Successful! / ምዝገባዎ ተሳክቷል!</b>\n\n` +
        `📱 <b>Phone:</b> <code>${record.phone_number}</code>\n` +
        `🎭 <b>Account Type:</b> <b>${roleDisplay}</b>\n\n` +
        `Your Telegram account is now linked to SkillConnect! Whenever you sign in on our web platform, ` +
        `your verification code will be sent right here.\n\n` +
        `Ready to explore?`;

      // Remove the native request_contact keyboard
      await sendTelegramDirectMessage(chatId, successMsg, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🔑 Get Login Code Now", callback_data: "request_otp" },
              { text: "🌐 Open SkillConnect Web", url: `${appUrl}/login` },
            ],
            [
              { text: "🔄 Switch Account Role", callback_data: record.role === "worker" ? "role_customer" : "role_worker" },
            ],
          ],
        },
      });

      return { handled: true, action: "contact_registered" };
    }

    // 2.2 /start command (supports deep linking e.g. /start role_worker or /start auth)
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const param = parts[1] || "";

      // Check if user already exists
      const existing = await findTelegramUserByChatId(chatId);

      if (existing && !param.startsWith("role_")) {
        const roleLabel = existing.role === "worker" ? "🛠 Expert (ባለሙያ)" : "👤 Client (አሰሪ)";
        const welcomeBack =
          `👋 <b>Welcome back to SkillConnect!</b>\n\n` +
          `Your account is linked:\n` +
          `📱 <b>Phone:</b> <code>${existing.phone_number}</code>\n` +
          `🎭 <b>Role:</b> <b>${roleLabel}</b>\n\n` +
          `What would you like to do?`;

        await sendTelegramDirectMessage(chatId, welcomeBack, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🔑 Get Web Login Code", callback_data: "request_otp" },
                { text: "🌐 Open Web App", url: `${appUrl}/login` },
              ],
              [
                {
                  text: existing.role === "worker" ? "Switch to Client" : "Switch to Expert",
                  callback_data: existing.role === "worker" ? "role_customer" : "role_worker",
                },
              ],
            ],
          },
        });
        return { handled: true, action: "welcome_back" };
      }

      // If deep link specifies role
      if (param === "role_worker" || param === "role_expert") {
        setPendingRole(chatId, "worker");
      } else if (param === "role_client" || param === "role_customer") {
        setPendingRole(chatId, "customer");
      }

      const welcomeMsg =
        `👋 <b>Welcome to SkillConnect! / እንኳን ወደ ስኪል ኮኔክት በደህና መጡ!</b> 🇪🇹\n\n` +
        `The platform connecting certified home-service & trade experts with clients across Ethiopia.\n\n` +
        `Please select how you want to register:`;

      await sendTelegramDirectMessage(chatId, welcomeMsg, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🛠 I am an Expert (ስራ ፈላጊ / ባለሙያ)", callback_data: "role_worker" },
            ],
            [
              { text: "👤 I am a Client (አሰሪ / ደንበኛ)", callback_data: "role_customer" },
            ],
          ],
        },
      });

      return { handled: true, action: "start_prompt" };
    }

    // 2.3 /otp or Login Code command
    if (text === "/otp" || text.toLowerCase().includes("login code") || text.includes("🔑")) {
      const existing = await findTelegramUserByChatId(chatId);
      if (existing) {
        const { code } = await generateLoginOtpForPhone(existing.phone_number);
        const encodedPhone = encodeURIComponent(existing.phone_number);
        const loginUrl = `${appUrl}/verify-otp?phone=${encodedPhone}&code=${code}`;

        await sendTelegramDirectMessage(
          chatId,
          `🔐 <b>SkillConnect Login Code</b>\n\n` +
          `Your verification code: <b>${code}</b>\n\n` +
          `📱 Phone: <code>${existing.phone_number}</code>\n` +
          `🎭 Role: <b>${existing.role === "worker" ? "Expert" : "Client"}</b>\n` +
          `⏱ Expires in 5 minutes.\n\n` +
          `👉 <a href="${loginUrl}"><b>Tap here to sign in to SkillConnect</b></a>`
        );
      } else {
        await sendTelegramDirectMessage(
          chatId,
          `You haven't linked your phone number yet. Please type /start to register as an Expert or Client.`
        );
      }
      return { handled: true, action: "otp_command" };
    }

    // 2.4 /switch or Role Toggle
    if (text === "/switch" || text === "/role") {
      await sendTelegramDirectMessage(chatId, "Choose your preferred role:", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🛠 Switch to Expert (ባለሙያ)", callback_data: "role_worker" }],
            [{ text: "👤 Switch to Client (አሰሪ)", callback_data: "role_customer" }],
          ],
        },
      });
      return { handled: true, action: "switch_prompt" };
    }

    // 2.5 Manual Phone Number Typing (Fallback if user types 09... or +251...)
    const normalizedTyped = normalizeEthiopianPhone(text);
    if (normalizedTyped.length >= 10 && (normalizedTyped.startsWith("+2519") || normalizedTyped.startsWith("+2517"))) {
      const pendingRole = getPendingRole(chatId) || "customer";
      const record = await upsertTelegramUser({
        phoneNumber: normalizedTyped,
        telegramChatId: String(chatId),
        telegramUserId: String(msg.from?.id || ""),
        telegramUsername: msg.from?.username,
        role: pendingRole,
      });

      await sendTelegramDirectMessage(
        chatId,
        `✅ <b>Phone number registered!</b>\n\n` +
        `📱 Phone: <code>${record.phone_number}</code>\n` +
        `🎭 Role: <b>${record.role === "worker" ? "Expert" : "Client"}</b>\n\n` +
        `You can now use the SkillConnect web app at ${appUrl}/login.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔑 Get Web Login Code", callback_data: "request_otp" }],
              [{ text: "🌐 Open Web App", url: `${appUrl}/login` }],
            ],
          },
        }
      );
      return { handled: true, action: "typed_phone_registered" };
    }

    // 2.6 Default help reply
    await sendTelegramDirectMessage(
      chatId,
      `👋 <b>SkillConnect Bot Assistance</b>\n\n` +
      `Commands:\n` +
      `/start - Register or view your account status\n` +
      `/otp - Get your web login verification code\n` +
      `/switch - Switch between Expert and Client mode\n\n` +
      `🌐 Visit: ${appUrl}`
    );
    return { handled: true, action: "help_reply" };
  }

  return { handled: false };
}