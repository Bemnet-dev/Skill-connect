using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SkillConnect.Api.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst("sub")?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst("sub")?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Server-side method to push a notification to a specific user.
    /// Called by other services when creating notifications.
    /// </summary>
    public static async Task SendNotificationToUser(IHubContext<NotificationHub> hubContext, string userId, string type, string payload)
    {
        await hubContext.Clients.Group($"user_{userId}").SendAsync("ReceiveNotification", new
        {
            type,
            payload,
            timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Server-side method to broadcast a notification to all connected users.
    /// </summary>
    public static async Task BroadcastNotification(IHubContext<NotificationHub> hubContext, string type, string payload)
    {
        await hubContext.Clients.All.SendAsync("ReceiveNotification", new
        {
            type,
            payload,
            timestamp = DateTime.UtcNow
        });
    }
}
