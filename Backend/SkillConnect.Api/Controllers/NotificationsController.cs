using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillConnect.Api.DTOs;
using SkillConnect.Api.Services;

namespace SkillConnect.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController(INotificationService notificationService) : ControllerBase
{
    /// <summary>
    /// Get all notifications for the current user.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<NotificationResponse>>> GetMy(CancellationToken ct)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var notifications = await notificationService.GetForUserAsync(userId, ct);
        return Ok(notifications);
    }

    /// <summary>
    /// Get unread notification count.
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount(CancellationToken ct)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var count = await notificationService.GetUnreadCountAsync(userId, ct);
        return Ok(count);
    }

    /// <summary>
    /// Mark notifications as read.
    /// </summary>
    [HttpPost("mark-read")]
    public async Task<IActionResult> MarkAsRead(
        [FromBody] MarkNotificationReadRequest request,
        CancellationToken ct)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        await notificationService.MarkAsReadAsync(request.NotificationIds, userId, ct);
        return NoContent();
    }
}
