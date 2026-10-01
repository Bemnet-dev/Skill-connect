namespace SkillConnect.Api.Configuration;

public class TelegramBotOptions
{
    public const string SectionName = "TelegramBot";

    public string BotToken { get; set; } = string.Empty;
    public string WebhookUrl { get; set; } = string.Empty;
    public string BetterAuthUrl { get; set; } = "http://localhost:3000";
    public string MiniAppUrl { get; set; } = "http://localhost:3000";
    public long AdminChatId { get; set; }
}