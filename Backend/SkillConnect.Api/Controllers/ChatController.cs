using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillConnect.Api.DTOs;
using SkillConnect.Api.Services;

namespace SkillConnect.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController(IChatService chatService) : ControllerBase
{
    /// <summary>
    /// Create a new chat thread.
    /// </summary>
    [HttpPost("threads")]
    public async Task<ActionResult<ChatThreadResponse>> CreateThread(
        [FromBody] CreateChatThreadRequest request,
        CancellationToken ct)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var thread = await chatService.CreateThreadAsync(userId, request, ct);
        return CreatedAtAction(nameof(GetThread), new { threadId = thread.Id }, thread);
    }

    /// <summary>
    /// Get all chat threads for the current user.
    /// </summary>
    [HttpGet("threads")]
    public async Task<ActionResult<List<ChatThreadResponse>>> GetMyThreads(CancellationToken ct)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var threads = await chatService.GetThreadsForUserAsync(userId, ct);
        return Ok(threads);
    }

    /// <summary>
    /// Get a specific chat thread.
    /// </summary>
    [HttpGet("threads/{threadId:int}")]
    public async Task<ActionResult<ChatThreadResponse>> GetThread(int threadId, CancellationToken ct)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var thread = await chatService.GetThreadAsync(threadId, userId, ct);
        return thread is null ? NotFound() : Ok(thread);
    }

    /// <summary>
    /// Send a message in a chat thread.
    /// </summary>
    [HttpPost("messages")]
    public async Task<ActionResult<MessageDto>> SendMessage(
        [FromBody] SendMessageRequest request,
        CancellationToken ct)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        try
        {
            var message = await chatService.SendMessageAsync(userId, request, ct);
            return Ok(message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Get all messages in a chat thread.
    /// </summary>
    [HttpGet("threads/{threadId:int}/messages")]
    public async Task<ActionResult<List<MessageDto>>> GetMessages(int threadId, CancellationToken ct)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        try
        {
            var messages = await chatService.GetMessagesAsync(threadId, userId, ct);
            return Ok(messages);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }
}
