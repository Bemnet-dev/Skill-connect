using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkillConnect.Api.Services;
using SkillConnect.Infrastructure.Persistence;

namespace SkillConnect.Api.Controllers;

[ApiController]
[Route("api/telegram")]
public class TelegramWebhookController : ControllerBase
{
    private readonly ITelegramBotService _telegramBotService;
    private readonly ILogger<TelegramWebhookController> _logger;

    public TelegramWebhookController(
        ITelegramBotService telegramBotService,
        ILogger<TelegramWebhookController> logger)
    {
        _telegramBotService = telegramBotService;
        _logger = logger;
    }

    /// <summary>
    /// Webhook endpoint for receiving Telegram updates
    /// </summary>
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> Webhook([FromBody] TelegramUpdate update)
    {
        try
        {
            _logger.LogInformation("Received Telegram update: {UpdateId}", update.UpdateId);
            await _telegramBotService.HandleUpdateAsync(update);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Telegram webhook");
            return StatusCode(500);
        }
    }

    /// <summary>
    /// Set the webhook URL for the Telegram bot
    /// </summary>
    [HttpPost("set-webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> SetWebhook([FromBody] SetWebhookRequest request, [FromServices] IConfiguration configuration)
    {
        var botToken = configuration["TelegramBot:BotToken"];
        var webhookUrl = request.Url ?? configuration["TelegramBot:WebhookUrl"];
        
        if (string.IsNullOrEmpty(botToken) || string.IsNullOrEmpty(webhookUrl))
        {
            return BadRequest("Bot token or webhook URL not configured");
        }

        using var httpClient = new HttpClient();
        var url = $"https://api.telegram.org/bot{botToken}/setWebhook?url={webhookUrl}/api/telegram/webhook";
        var response = await httpClient.GetAsync(url);
        var content = await response.Content.ReadAsStringAsync();
        
        return Content(content, "application/json");
    }

    /// <summary>
    /// Delete the webhook for the Telegram bot
    /// </summary>
    [HttpPost("delete-webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> DeleteWebhook([FromServices] IConfiguration configuration)
    {
        var botToken = configuration["TelegramBot:BotToken"];
        
        if (string.IsNullOrEmpty(botToken))
        {
            return BadRequest("Bot token not configured");
        }

        using var httpClient = new HttpClient();
        var url = $"https://api.telegram.org/bot{botToken}/deleteWebhook";
        var response = await httpClient.GetAsync(url);
        var content = await response.Content.ReadAsStringAsync();
        
        return Content(content, "application/json");
    }

    /// <summary>
    /// Get webhook info
    /// </summary>
    [HttpGet("webhook-info")]
    [AllowAnonymous]
    public async Task<IActionResult> GetWebhookInfo([FromServices] IConfiguration configuration)
    {
        var botToken = configuration["TelegramBot:BotToken"];
        
        if (string.IsNullOrEmpty(botToken))
        {
            return BadRequest("Bot token not configured");
        }

        using var httpClient = new HttpClient();
        var url = $"https://api.telegram.org/bot{botToken}/getWebhookInfo";
        var response = await httpClient.GetAsync(url);
        var content = await response.Content.ReadAsStringAsync();
        
        return Content(content, "application/json");
    }

    /// <summary>
    /// Test endpoint to send OTP via bot
    /// </summary>
    [HttpPost("send-otp")]
    public async Task<IActionResult> SendOtp(
        [FromBody] SendOtpRequest request,
        [FromServices] ITelegramBotService telegramBotService,
        [FromServices] AppDbContext dbContext,
        [FromServices] IConfiguration configuration)
    {
        try
        {
            // Validate internal secret
            var internalSecret = Request.Headers["x-internal-secret"].FirstOrDefault();
            var expectedSecret = configuration["InternalRevalidateSecret"];
            
            if (string.IsNullOrEmpty(internalSecret) || internalSecret != expectedSecret)
            {
                return Unauthorized();
            }

            // Get chat ID from stored mapping
            var phoneNumber = await TelegramBotService.GetPhoneNumberByTelegramIdAsync(dbContext, request.TelegramUserId);
            
            if (phoneNumber == null)
            {
                return NotFound("Telegram user not found. Please start the bot first.");
            }

            var mapping = await TelegramBotService.GetMappingByTelegramIdAsync(dbContext, request.TelegramUserId);
            var language = mapping?.Language ?? request.Language ?? "en";

            await telegramBotService.SendOtpAsync(
                request.TelegramUserId, 
                phoneNumber, 
                request.Code, 
                language);

            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending OTP via Telegram");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}

public class SendOtpRequest
{
    public long TelegramUserId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Language { get; set; }
}

public class SetWebhookRequest
{
    public string? Url { get; set; }
}