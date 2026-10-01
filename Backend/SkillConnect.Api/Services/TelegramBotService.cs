using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SkillConnect.Api.Configuration;
using SkillConnect.Api.DTOs;
using SkillConnect.Infrastructure.Persistence;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SkillConnect.Api.Services;

public interface ITelegramBotService
{
    Task HandleUpdateAsync(TelegramUpdate update, CancellationToken ct = default);
    Task SendOtpAsync(long chatId, string phoneNumber, string code, string language, CancellationToken ct = default);
    Task SendWelcomeMessageAsync(long chatId, string language, CancellationToken ct = default);
    Task SendLanguageSelectionAsync(long chatId, CancellationToken ct = default);
    Task SendRegistrationCompleteAsync(long chatId, string language, string role, CancellationToken ct = default);
}

public class TelegramBotService : ITelegramBotService
{
    private readonly HttpClient _httpClient;
    private readonly TelegramBotOptions _options;
    private readonly ILogger<TelegramBotService> _logger;
    private readonly AppDbContext _dbContext;

    public TelegramBotService(
        HttpClient httpClient,
        IOptions<TelegramBotOptions> options,
        ILogger<TelegramBotService> logger,
        AppDbContext dbContext)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
        _dbContext = dbContext;
        
        _httpClient.BaseAddress = new Uri($"https://api.telegram.org/bot{_options.BotToken}/");
    }

    public async Task HandleUpdateAsync(TelegramUpdate update, CancellationToken ct = default)
    {
        try
        {
            if (update.Message != null)
            {
                await HandleMessageAsync(update.Message, ct);
            }
            else if (update.CallbackQuery != null)
            {
                await HandleCallbackQueryAsync(update.CallbackQuery, ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling Telegram update");
        }
    }

    private async Task HandleMessageAsync(TelegramMessage message, CancellationToken ct)
    {
        if (message.From is null)
        {
            _logger.LogWarning("Received message without From field, skipping.");
            return;
        }

        var chatId = message.Chat.Id;
        var text = message.Text ?? "";

        if (text.StartsWith("/start"))
        {
            // Check if user is selecting a role
            if (text.Contains("role="))
            {
                var role = text.Split("role=")[1].Split(' ')[0];
                await HandleRoleSelectionAsync(chatId, message.From.Id, role, message.From.LanguageCode ?? "en", ct);
            }
            else
            {
                await SendLanguageSelectionAsync(chatId, ct);
            }
        }
        else if (message.Contact != null)
        {
            // User shared their contact
            await HandleContactSharedAsync(chatId, message.From.Id, message.Contact.PhoneNumber, message.From.LanguageCode ?? "en", ct);
        }
        else if (text == "🇪🇹 Amharic" || text == "🇬🇧 English")
        {
            // Language selection
            var language = text.Contains("Amharic") ? "am" : "en";
            await SendRoleSelectionAsync(chatId, language, ct);
        }
        else if (text == "👤 Client" || text == "🔧 Expert" || text == "ደንበኛ" || text == "ባለሞያ")
        {
            // Role selection from keyboard
            var isAmharic = text.Contains("ደንበኛ") || text.Contains("ባለሞያ");
            var language = isAmharic ? "am" : "en";
            var role = text.Contains("Client") || text.Contains("ደንበኛ") ? "client" : "expert";
            await HandleRoleSelectionAsync(chatId, message.From.Id, role, language, ct);
        }
    }

    private async Task HandleCallbackQueryAsync(TelegramCallbackQuery callbackQuery, CancellationToken ct)
    {
        var chatId = callbackQuery.Message?.Chat.Id ?? 0;
        var data = callbackQuery.Data ?? "";
        var userId = callbackQuery.From.Id;
        var language = callbackQuery.From.LanguageCode ?? "en";

        if (data.StartsWith("lang_"))
        {
            var lang = data.Split('_')[1];
            await SendRoleSelectionAsync(chatId, lang, ct);
            await AnswerCallbackQueryAsync(callbackQuery.Id, ct);
        }
        else if (data.StartsWith("role_"))
        {
            var role = data.Split('_')[1];
            await HandleRoleSelectionAsync(chatId, userId, role, language, ct);
            await AnswerCallbackQueryAsync(callbackQuery.Id, ct);
        }
        else if (data == "share_contact")
        {
            await RequestContactAsync(chatId, language, ct);
            await AnswerCallbackQueryAsync(callbackQuery.Id, ct);
        }
    }

    public async Task SendLanguageSelectionAsync(long chatId, CancellationToken ct)
    {
        var keyboard = new
        {
            inline_keyboard = new[]
            {
                new[] { new { text = "🇪🇹 አማርኛ (Amharic)", callback_data = "lang_am" } },
                new[] { new { text = "🇬🇧 English", callback_data = "lang_en" } }
            }
        };

        var message = "የቋንቋ ተወዳጅዎን ይምረጡ / Select your preferred language:";
        await SendMessageAsync(chatId, message, keyboard, "Markdown", ct);
    }

    private async Task SendRoleSelectionAsync(long chatId, string language, CancellationToken ct)
    {
        var isAmharic = language == "am";
        var keyboard = new
        {
            inline_keyboard = new[]
            {
                new[] { new { text = isAmharic ? "👤 ደንበኛ (Client)" : "👤 Client", callback_data = "role_client" } },
                new[] { new { text = isAmharic ? "🔧 ባለሞያ (Expert)" : "🔧 Expert", callback_data = "role_expert" } }
            }
        };

        var message = isAmharic
            ? "እባክዎ የሚፈልጉትን ሚና ይምረጡ:"
            : "Please select your role:";

        await SendMessageAsync(chatId, message, keyboard, "Markdown", ct);
    }

    private async Task HandleRoleSelectionAsync(long chatId, long telegramUserId, string role, string language, CancellationToken ct)
    {
        var isAmharic = language == "am";
        var roleDisplay = role == "client" ? (isAmharic ? "ደንበኛ" : "Client") : (isAmharic ? "ባለሞያ" : "Expert");
        
        // Store role in database for later use when contact is shared
        await StoreTelegramMappingAsync(telegramUserId, "", language, role == "client" ? "customer" : "worker", ct);
        
        var keyboard = new
        {
            reply_markup = new
            {
                keyboard = new[]
                {
                    new[] { new { text = isAmharic ? "📱 የስልክ ቁጥርን አስቀምጥ" : "📱 Share Phone Number", request_contact = true } }
                },
                resize_keyboard = true,
                one_time_keyboard = true
            }
        };

        var message = isAmharic
            ? $"አሁን ለ {roleDisplay} ስምምነት የሚያስፈልገው የስልክ ቁጥርዎን ያስቀምጡ."
            : $"Now please share your phone number to register as {roleDisplay}.";

        await SendMessageAsync(chatId, message, keyboard, "Markdown", ct);
    }

    private async Task RequestContactAsync(long chatId, string language, CancellationToken ct)
    {
        var isAmharic = language == "am";
        var keyboard = new
        {
            reply_markup = new
            {
                keyboard = new[]
                {
                    new[] { new { text = isAmharic ? "📱 የስልክ ቁጥርን አስቀምጥ" : "📱 Share Phone Number", request_contact = true } }
                },
                resize_keyboard = true,
                one_time_keyboard = true
            }
        };

        var message = isAmharic
            ? "እባክዎ የስልክ ቁጥርዎን ለማረጋገጥ ያስቀምጡ:"
            : "Please share your phone number to proceed:";

        await SendMessageAsync(chatId, message, keyboard, "Markdown", ct);
    }

    private async Task HandleContactSharedAsync(long chatId, long telegramUserId, string phoneNumber, string language, CancellationToken ct)
    {
        // Normalize phone number to E.164 format
        var normalizedPhone = NormalizePhoneNumber(phoneNumber);
        
        var isAmharic = language == "am";
        
        // Get stored role from database
        var existingMapping = await _dbContext.TelegramUserMappings
            .FirstOrDefaultAsync(x => x.TelegramUserId == telegramUserId, ct);
        var role = existingMapping?.Role ?? "customer";
        
        // Send phone number to Better Auth to request OTP
        try
        {
            await SendOtpToBetterAuthAsync(normalizedPhone, ct);
            
            var message = isAmharic
                ? $"✅ እንኳን ደህና መዝግቡ ተጠናቋል! የማረጋገጫ ኮድ ይህ ቦት በኩል ይልካል። እባክዎ ድህረገጻችንን ይጎብኙ: {_options.MiniAppUrl}"
                : $"✅ Thank you for registering! We will send you the OTP through this bot. Please visit our website: {_options.MiniAppUrl}";

            // Remove keyboard
            var keyboard = new { reply_markup = new { remove_keyboard = true } };
            await SendMessageAsync(chatId, message, keyboard, "Markdown", ct);
            
            // Store telegram user mapping for later OTP delivery
            await StoreTelegramMappingAsync(telegramUserId, normalizedPhone, language, role, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send OTP for phone {Phone}", normalizedPhone);
            
            var message = isAmharic
                ? "❌ ስህተት አጋጥሧል። እባክዎ ደግሞ ይሞክሩ."
                : "❌ An error occurred. Please try again.";
            
            await SendMessageAsync(chatId, message, ct: ct);
        }
    }

    public async Task SendOtpAsync(long chatId, string phoneNumber, string code, string language, CancellationToken ct = default)
    {
        var isAmharic = language == "am";
        var message = isAmharic
            ? $"🔐 የደህንነት ኮድዎ: <b>{code}</b>\n\nይህ ኮድ 5 ደቂቃ ያለበት ነው። ለማናገር ማንም አያሳይበትም።"
            : $"🔐 Your verification code: <b>{code}</b>\n\nThis code expires in 5 minutes. Do not share it with anyone.";

        await SendMessageAsync(chatId, message, parseMode: "HTML", ct: ct);
    }

    public async Task SendWelcomeMessageAsync(long chatId, string language, CancellationToken ct = default)
    {
        var isAmharic = language == "am";
        var message = isAmharic
            ? "ወደ SkillConnect እንኳን በሰላም መጡ! 🎉\n\nይህ ቦት ለስልክ ቁጥር ማረጋገጫ እና መዝግብ ያገለግላል።"
            : "Welcome to SkillConnect! 🎉\n\nThis bot handles phone verification and registration.";

        await SendMessageAsync(chatId, message, ct: ct);
    }

    public async Task SendRegistrationCompleteAsync(long chatId, string language, string role, CancellationToken ct = default)
    {
        var isAmharic = language == "am";
        var roleDisplay = role == "client" ? (isAmharic ? "ደንበኛ" : "Client") : (isAmharic ? "ባለሞያ" : "Expert");
        
        var message = isAmharic
            ? $"✅ እንኳን ደህና መዝግብ ተጠናቋል! አሁን እርስዎ {roleDisplay} ነዎ። ወደ መተግበሪያው ለመግባት <a href=\"{_options.MiniAppUrl}\">ይሞክሩ</a>።"
            : $"✅ Registration complete! You are now registered as {roleDisplay}. <a href=\"{_options.MiniAppUrl}\">Click here</a> to open the app.";

        await SendMessageAsync(chatId, message, parseMode: "HTML", ct: ct);
    }

    private async Task SendOtpToBetterAuthAsync(string phoneNumber, CancellationToken ct)
    {
        var url = $"{_options.BetterAuthUrl}/api/auth/phone-number/send-otp";
        var response = await _httpClient.PostAsJsonAsync(url, new { phoneNumber }, ct);
        
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(ct);
            throw new Exception($"Better Auth OTP request failed: {error}");
        }
    }

    private async Task StoreTelegramMappingAsync(long telegramUserId, string phoneNumber, string language, string? role, CancellationToken ct)
    {
        var mapping = await _dbContext.TelegramUserMappings
            .FirstOrDefaultAsync(x => x.TelegramUserId == telegramUserId, ct);

        if (mapping == null)
        {
            mapping = new SkillConnect.Core.Entities.TelegramUserMapping
            {
                TelegramUserId = telegramUserId,
                PhoneNumber = phoneNumber,
                Language = language,
                Role = role,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(24)
            };
            _dbContext.TelegramUserMappings.Add(mapping);
        }
        else
        {
            mapping.PhoneNumber = phoneNumber;
            mapping.Language = language;
            mapping.Role = role;
            mapping.UpdatedAt = DateTime.UtcNow;
            mapping.ExpiresAt = DateTime.UtcNow.AddHours(24);
        }

        await _dbContext.SaveChangesAsync(ct);
    }

    public static async Task<string?> GetPhoneNumberByTelegramIdAsync(AppDbContext dbContext, long telegramUserId)
    {
        var mapping = await dbContext.TelegramUserMappings
            .FirstOrDefaultAsync(x => x.TelegramUserId == telegramUserId);
        return mapping?.PhoneNumber;
    }

    public static async Task<SkillConnect.Core.Entities.TelegramUserMapping?> GetMappingByTelegramIdAsync(AppDbContext dbContext, long telegramUserId)
    {
        return await dbContext.TelegramUserMappings
            .FirstOrDefaultAsync(x => x.TelegramUserId == telegramUserId);
    }

    private async Task SendMessageAsync(long chatId, string text, object? replyMarkup = null, string parseMode = "Markdown", CancellationToken ct = default)
    {
        var payload = new
        {
            chat_id = chatId,
            text = text,
            parse_mode = parseMode,
            reply_markup = replyMarkup
        };

        var response = await _httpClient.PostAsJsonAsync("sendMessage", payload, ct);
        
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("Failed to send Telegram message: {Error}", error);
        }
    }

    private async Task AnswerCallbackQueryAsync(string callbackQueryId, CancellationToken ct)
    {
        await _httpClient.PostAsJsonAsync("answerCallbackQuery", new { callback_query_id = callbackQueryId }, ct);
    }

    private static string NormalizePhoneNumber(string phoneNumber)
    {
        var digits = phoneNumber.Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "");
        
        if (digits.StartsWith("00"))
            digits = "+" + digits.Substring(2);
        else if (digits.StartsWith("0"))
            digits = "+251" + digits.Substring(1);
        else if (!digits.StartsWith("+"))
            digits = "+" + digits;

        return digits;
    }
}

// Telegram DTOs
public class TelegramUpdate
{
    [JsonPropertyName("update_id")]
    public int UpdateId { get; set; }

    [JsonPropertyName("message")]
    public TelegramMessage? Message { get; set; }

    [JsonPropertyName("callback_query")]
    public TelegramCallbackQuery? CallbackQuery { get; set; }
}

public class TelegramMessage
{
    [JsonPropertyName("message_id")]
    public int MessageId { get; set; }

    [JsonPropertyName("from")]
    public TelegramUser From { get; set; } = new();

    [JsonPropertyName("chat")]
    public TelegramChat Chat { get; set; } = new();

    [JsonPropertyName("text")]
    public string? Text { get; set; }

    [JsonPropertyName("contact")]
    public TelegramContact? Contact { get; set; }
}

public class TelegramUser
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("first_name")]
    public string? FirstName { get; set; }

    [JsonPropertyName("last_name")]
    public string? LastName { get; set; }

    [JsonPropertyName("username")]
    public string? Username { get; set; }

    [JsonPropertyName("language_code")]
    public string? LanguageCode { get; set; }
}

public class TelegramChat
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("title")]
    public string? Title { get; set; }
}

public class TelegramContact
{
    [JsonPropertyName("phone_number")]
    public string PhoneNumber { get; set; } = string.Empty;

    [JsonPropertyName("first_name")]
    public string? FirstName { get; set; }

    [JsonPropertyName("last_name")]
    public string? LastName { get; set; }

    [JsonPropertyName("user_id")]
    public long? UserId { get; set; }
}

public class TelegramCallbackQuery
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("from")]
    public TelegramUser From { get; set; } = new();

    [JsonPropertyName("message")]
    public TelegramMessage? Message { get; set; }

    [JsonPropertyName("data")]
    public string? Data { get; set; }
}