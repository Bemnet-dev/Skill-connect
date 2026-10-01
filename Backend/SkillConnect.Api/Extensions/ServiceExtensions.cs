using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SkillConnect.Api.Configuration;
using SkillConnect.Api.Hubs;
using SkillConnect.Api.Services;
using SkillConnect.Infrastructure.Persistence;
using System.Text;

namespace SkillConnect.Api.Extensions;

public static class ServiceExtensions
{
    /// <summary>
    /// Adds all application services to the DI container.
    /// </summary>
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Database
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                npgsql => npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

        // Configuration
        services.Configure<TelegramBotOptions>(configuration.GetSection(TelegramBotOptions.SectionName));

        // HTTP Client for Telegram Bot
        services.AddHttpClient<ITelegramBotService, TelegramBotService>((sp, client) =>
        {
            var options = sp.GetRequiredService<IOptions<TelegramBotOptions>>().Value;
            client.BaseAddress = new Uri($"https://api.telegram.org/bot{options.BotToken}/");
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        // Services
        services.AddScoped<IWorkerService, WorkerService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IJobRequestService, JobRequestService>();
        services.AddScoped<IQuoteService, QuoteService>();
        services.AddScoped<IBookingService, BookingService>();
        services.AddScoped<IReviewService, ReviewService>();
        services.AddScoped<IChatService, ChatService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IVerificationService, VerificationService>();
        services.AddScoped<IDisputeService, DisputeService>();
        services.AddScoped<IPaymentService, PaymentService>();

        // SignalR
        services.AddSignalR();

        // CORS
        services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend", policy =>
            {
                var frontendOrigin = configuration["Frontend:Url"] ?? "http://localhost:3000";
                policy.WithOrigins(frontendOrigin)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        // JWT Authentication
        var betterAuthUrl = configuration["BetterAuth:BaseUrl"] ?? "http://localhost:3000";
        var issuer = configuration["BetterAuth:Issuer"] ?? "skill-connect";
        var audience = configuration["BetterAuth:Audience"] ?? "skill-connect-api";
        var secret = configuration["BetterAuth:Secret"] ?? configuration["BetterAuth:JwtSecret"] ?? throw new InvalidOperationException("BetterAuth:Secret or BetterAuth:JwtSecret must be configured");

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                // Don't use Authority/JWKS - we validate with shared symmetric key (HS256)
                options.Authority = null;
                options.Audience = audience;
                options.RequireHttpsMetadata = false;
                options.Configuration = null; // Disable auto-config from metadata endpoint

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = issuer,
                    ValidateAudience = true,
                    ValidAudience = audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(5),
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = signingKey
                };

                // SignalR auth - read token from query string for WebSocket connections
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) &&
                            path.StartsWithSegments("/hubs"))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
            options.AddPolicy("WorkerOnly", policy => policy.RequireRole("Worker"));
            options.AddPolicy("CustomerOnly", policy => policy.RequireRole("Customer"));
        });

        return services;
    }
}
