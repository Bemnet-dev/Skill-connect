using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SkillConnect.Api.Hubs;
using SkillConnect.Api.Services;
using SkillConnect.Infrastructure.Persistence;

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

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Authority = betterAuthUrl;
                options.Audience = audience;
                options.RequireHttpsMetadata = false; // Set to true in production

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = issuer,
                    ValidateAudience = true,
                    ValidAudience = audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(5),
                    ValidateIssuerSigningKey = true
                };

                // SignalR auth
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
