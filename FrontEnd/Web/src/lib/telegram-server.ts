import { Pool } from "pg";
import { env } from "@/env";
import crypto from "crypto";

let dbPool: Pool | null = null;

function getDbPool(): Pool {
  if (!dbPool) {
    dbPool = new Pool({ connectionString: env.DATABASE_URL });
  }
  return dbPool;
}

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

/**
 * Normalizes Ethiopian phone numbers into international E.164 (+2519... or +2517...)
 */
export function normalizeEthiopianPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.trim().replace(/[^\d+]/g, "");
  const digitsOnly = cleaned.replace(/\D/g, "");

  // 10 digits starting with 09 (Ethio Telecom) or 07 (Safaricom)
  if (digitsOnly.length === 10 && (digitsOnly.startsWith("09") || digitsOnly.startsWith("07"))) {
    return `+251${digitsOnly.slice(1)}`;
  }

  // 9 digits starting with 9 or 7
  if (digitsOnly.length === 9 && (digitsOnly.startsWith("9") || digitsOnly.startsWith("7"))) {
    return `+251${digitsOnly}`;
  }

  // 12 digits starting with 251
  if (digitsOnly.length === 12 && digitsOnly.startsWith("251")) {
    return `+${digitsOnly}`;
  }

  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  return `+${digitsOnly}`;
}

/**
 * Finds linked Telegram chat ID for a given phone number
 */
export async function findTelegramChatIdForPhone(
  phoneNumber: string
): Promise<string | null> {
  try {
    const normalized = normalizeEthiopianPhone(phoneNumber);
    const digitsOnly = normalized.replace(/\D/g, "");
    const last9Digits = digitsOnly.slice(-9);

    const pool = getDbPool();
    const query = `
      SELECT telegram_chat_id 
      FROM telegram_users 
      WHERE phone_number = $1 
         OR phone_number LIKE $2
      ORDER BY updated_at DESC 
      LIMIT 1
    `;
    const res = await pool.query(query, [normalized, `%${last9Digits}`]);
    if (res.rows.length > 0) {
      return res.rows[0].telegram_chat_id;
    }
  } catch (err) {
    console.error("[Telegram] Error searching chat ID for phone:", err);
  }
  return null;
}

/**
 * Finds user record in telegram_users by Telegram chat ID
 */
export async function findTelegramUserByChatId(
  chatId: string | number
): Promise<TelegramUserRecord | null> {
  try {
    const pool = getDbPool();
    const res = await pool.query(
      `SELECT * FROM telegram_users WHERE telegram_chat_id = $1 LIMIT 1`,
      [String(chatId)]
    );
    if (res.rows.length > 0) {
      return res.rows[0] as TelegramUserRecord;
    }
  } catch (err) {
    console.error("[Telegram] Error querying user by chat ID:", err);
  }
  return null;
}

/**
 * Upserts a Telegram user into the database and syncs with the user/worker profile tables
 */
export async function upsertTelegramUser({
  phoneNumber,
  telegramChatId,
  telegramUserId,
  telegramUsername,
  role = "customer",
}: {
  phoneNumber: string;
  telegramChatId: string;
  telegramUserId?: string;
  telegramUsername?: string;
  role?: "customer" | "worker";
}): Promise<TelegramUserRecord> {
  const normalizedPhone = normalizeEthiopianPhone(phoneNumber);
  const pool = getDbPool();

  // 1. Upsert into telegram_users
  const query = `
    INSERT INTO telegram_users (
      phone_number, telegram_chat_id, telegram_user_id, telegram_username, role, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, NOW())
    ON CONFLICT (phone_number) 
    DO UPDATE SET 
      telegram_chat_id = EXCLUDED.telegram_chat_id,
      telegram_user_id = COALESCE(EXCLUDED.telegram_user_id, telegram_users.telegram_user_id),
      telegram_username = COALESCE(EXCLUDED.telegram_username, telegram_users.telegram_username),
      role = COALESCE(EXCLUDED.role, telegram_users.role),
      updated_at = NOW()
    RETURNING *;
  `;
  const result = await pool.query(query, [
    normalizedPhone,
    String(telegramChatId),
    telegramUserId ? String(telegramUserId) : null,
    telegramUsername || null,
    role,
  ]);

  const record = result.rows[0] as TelegramUserRecord;

  // 2. Check if a Better Auth user exists with this phone number
  try {
    const userResult = await pool.query(
      `SELECT id, role, name FROM "user" WHERE "phoneNumber" = $1 LIMIT 1`,
      [normalizedPhone]
    );

    if (userResult.rows.length > 0) {
      const existingUser = userResult.rows[0];
      // Update role if changed
      if (role && existingUser.role !== role) {
        await pool.query(
          `UPDATE "user" SET role = $1, "updatedAt" = NOW() WHERE id = $2`,
          [role, existingUser.id]
        );
      }

      // If worker, ensure worker_profiles entry exists
      if (role === "worker") {
        await ensureWorkerProfile(existingUser.id, existingUser.name || normalizedPhone);
      }
    }
  } catch (err) {
    console.error("[Telegram] Error updating linked Better Auth user:", err);
  }

  return record;
}

/**
 * Ensures worker_profiles entry exists for a worker user
 */
async function ensureWorkerProfile(userId: string, displayName: string): Promise<void> {
  const pool = getDbPool();
  try {
    const existing = await pool.query(
      `SELECT "Id" FROM worker_profiles WHERE "UserId" = $1 LIMIT 1`,
      [userId]
    );

    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO worker_profiles (
          "UserId", "DisplayName", "Bio", "CategoryIds", "ServiceRadiusKm", 
          "RatingAverage", "JobsCompleted", "IsVerified", "CreatedAt", "UpdatedAt"
        ) VALUES (
          $1, $2, 'Experienced service provider', '', 25, 0.0, 0, false, NOW(), NOW()
        )`,
        [userId, displayName]
      );
    }
  } catch (err) {
    console.error("[Telegram] Error ensuring worker profile:", err);
  }
}

/**
 * Generates an OTP directly in the Better Auth verification table
 * for a linked phone number and returns the code
 */
export async function generateLoginOtpForPhone(
  phoneNumber: string
): Promise<{ code: string; expiresAt: Date }> {
  const normalizedPhone = normalizeEthiopianPhone(phoneNumber);
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  const pool = getDbPool();

  // Clear previous active verification for this phone number
  await pool.query(`DELETE FROM verification WHERE identifier = $1`, [normalizedPhone]);

  // Insert new verification value matching Better Auth's phone-number plugin format
  await pool.query(
    `INSERT INTO verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, NOW(), NOW())`,
    [crypto.randomUUID(), normalizedPhone, code, expiresAt]
  );

  return { code, expiresAt };
}

/**
 * Sends a message to a specific Telegram chat using the Bot API
 * with timeout and retry logic for transient network errors.
 */
export async function sendTelegramDirectMessage(
  chatId: string | number,
  text: string,
  options?: {
    parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
    reply_markup?: unknown;
  }
): Promise<void> {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  await sendTelegramApiWithRetry(url, {
    chat_id: String(chatId),
    text,
    parse_mode: options?.parse_mode ?? "HTML",
    ...(options?.reply_markup ? { reply_markup: options.reply_markup } : {}),
  });
}

/**
 * Makes a Telegram API call with timeout and retry logic to handle transient network errors.
 */
async function sendTelegramApiWithRetry(url: string, body: Record<string, unknown>, retries = 2): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Telegram API error (${res.status}): ${errorBody}`);
    }
  } catch (err) {
    clearTimeout(timeoutId);
    
    if (retries > 0 && (err instanceof TypeError || err instanceof DOMException)) {
      // Retry on network errors (ECONNRESET, timeout, etc.)
      console.warn(`Telegram API call failed, retrying... (${retries} retries left):`, err);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1s delay before retry
      return sendTelegramApiWithRetry(url, body, retries - 1);
    }
    
    console.error(`Telegram API call failed after retries:`, err);
    throw err;
  }
}

/**
 * Acknowledges a Telegram callback query with timeout and retry logic.
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
): Promise<void> {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
  await sendTelegramApiWithRetry(url, {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {}),
  }).catch(() => {}); // Silently ignore callback query failures
}