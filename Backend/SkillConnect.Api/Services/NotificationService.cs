using Microsoft.EntityFrameworkCore;
using SkillConnect.Api.DTOs;
using SkillConnect.Core.Entities;
using SkillConnect.Infrastructure.Persistence;

namespace SkillConnect.Api.Services;

public interface INotificationService
{
    Task<NotificationResponse> CreateAsync(string userId, string type, string payload, CancellationToken ct = default);
    Task<List<NotificationResponse>> GetForUserAsync(string userId, CancellationToken ct = default);
    Task MarkAsReadAsync(int[] notificationIds, string userId, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(string userId, CancellationToken ct = default);
}

public class NotificationService(AppDbContext db) : INotificationService
{
    public async Task<NotificationResponse> CreateAsync(string userId, string type, string payload, CancellationToken ct = default)
    {
        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Payload = payload,
            CreatedAt = DateTime.UtcNow
        };

        db.Notifications.Add(notification);
        await db.SaveChangesAsync(ct);

        return MapToResponse(notification);
    }

    public async Task<List<NotificationResponse>> GetForUserAsync(string userId, CancellationToken ct = default)
    {
        var notifications = await db.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(100)
            .AsNoTracking()
            .ToListAsync(ct);

        return notifications.Select(MapToResponse).ToList();
    }

    public async Task MarkAsReadAsync(int[] notificationIds, string userId, CancellationToken ct = default)
    {
        var notifications = await db.Notifications
            .Where(n => notificationIds.Contains(n.Id) && n.UserId == userId)
            .ToListAsync(ct);

        foreach (var n in notifications)
            n.ReadAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
    }

    public async Task<int> GetUnreadCountAsync(string userId, CancellationToken ct = default)
    {
        return await db.Notifications
            .CountAsync(n => n.UserId == userId && n.ReadAt == null, ct);
    }

    private static NotificationResponse MapToResponse(Notification n)
    {
        return new NotificationResponse(
            n.Id,
            n.UserId,
            n.Type,
            n.Payload,
            n.ReadAt,
            n.CreatedAt
        );
    }
}
