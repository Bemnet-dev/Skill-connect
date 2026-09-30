using System.Net;
using System.Text.Json;

namespace SkillConnect.Api.Middleware;

/// <summary>
/// Global exception handling middleware that returns RFC 7807 Problem Details.
/// </summary>
public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/problem+json";

        var (statusCode, title, detail) = exception switch
        {
            ArgumentException => (HttpStatusCode.BadRequest, "Bad Request", exception.Message),
            UnauthorizedAccessException => (HttpStatusCode.Forbidden, "Forbidden", "You do not have permission to perform this action."),
            KeyNotFoundException => (HttpStatusCode.NotFound, "Not Found", "The requested resource was not found."),
            InvalidOperationException => (HttpStatusCode.Conflict, "Conflict", exception.Message),
            _ => (HttpStatusCode.InternalServerError, "Internal Server Error", "An unexpected error occurred.")
        };

        context.Response.StatusCode = (int)statusCode;

        var problemDetails = new
        {
            type = $"https://httpstatuses.io/{(int)statusCode}",
            title,
            status = (int)statusCode,
            detail,
            traceId = context.TraceIdentifier,
            timestamp = DateTime.UtcNow
        };

        var json = JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
