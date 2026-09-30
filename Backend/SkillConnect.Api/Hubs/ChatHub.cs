using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SkillConnect.Api.Services;

namespace SkillConnect.Api.Hubs;

[Authorize]
public class ChatHub(IChatService chatService) : Hub
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
    /// Send a message to a chat thread.
    /// </summary>
    public async Task SendMessage(int threadId, string content, string? attachmentUrl)
    {
        var userId = Context.User?.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            await Clients.Caller.SendAsync("Error", "Unauthorized");
            return;
        }

        try
        {
            var message = await chatService.SendMessageAsync(userId, new DTOs.SendMessageRequest(threadId, content, attachmentUrl));
            await Clients.Group($"thread_{threadId}").SendAsync("ReceiveMessage", message);
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("Error", ex.Message);
        }
    }

    /// <summary>
    /// Join a chat thread group.
    /// </summary>
    public async Task JoinThread(int threadId)
    {
        var userId = Context.User?.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return;

        try
        {
            await chatService.GetThreadAsync(threadId, userId);
            await Groups.AddToGroupAsync(Context.ConnectionId, $"thread_{threadId}");
        }
        catch
        {
            // Not a participant
        }
    }

    /// <summary>
    /// Leave a chat thread group.
    /// </summary>
    public async Task LeaveThread(int threadId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"thread_{threadId}");
    }

    /// <summary>
    /// Mark messages as read in a thread.
    /// </summary>
    public async Task MarkThreadRead(int threadId)
    {
        var userId = Context.User?.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return;

        await Clients.Group($"thread_{threadId}").SendAsync("ThreadRead", threadId, userId);
    }
}
