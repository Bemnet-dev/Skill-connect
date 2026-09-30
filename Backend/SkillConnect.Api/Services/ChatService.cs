using Microsoft.EntityFrameworkCore;
using SkillConnect.Api.DTOs;
using SkillConnect.Core.Entities;
using SkillConnect.Infrastructure.Persistence;

namespace SkillConnect.Api.Services;

public interface IChatService
{
    Task<ChatThreadResponse> CreateThreadAsync(string userId, CreateChatThreadRequest request, CancellationToken ct = default);
    Task<List<ChatThreadResponse>> GetThreadsForUserAsync(string userId, CancellationToken ct = default);
    Task<ChatThreadResponse?> GetThreadAsync(int threadId, string userId, CancellationToken ct = default);
    Task<MessageDto> SendMessageAsync(string senderId, SendMessageRequest request, CancellationToken ct = default);
    Task<List<MessageDto>> GetMessagesAsync(int threadId, string userId, CancellationToken ct = default);
}

public class ChatService(AppDbContext db) : IChatService
{
    public async Task<ChatThreadResponse> CreateThreadAsync(string userId, CreateChatThreadRequest request, CancellationToken ct = default)
    {
        var participants = request.ParticipantIds.Distinct().ToList();
        if (!participants.Contains(userId))
            participants.Add(userId);

        var thread = new ChatThread
        {
            BookingId = request.BookingId,
            Participants = string.Join(',', participants),
            CreatedAt = DateTime.UtcNow
        };

        db.ChatThreads.Add(thread);
        await db.SaveChangesAsync(ct);

        return new ChatThreadResponse(
            thread.Id,
            thread.BookingId,
            participants.ToArray(),
            thread.CreatedAt,
            []
        );
    }

    public async Task<List<ChatThreadResponse>> GetThreadsForUserAsync(string userId, CancellationToken ct = default)
    {
        var threads = await db.ChatThreads
            .Include(t => t.Messages.OrderByDescending(m => m.SentAt).Take(20))
            .Where(t => t.Participants.Contains(userId))
            .OrderByDescending(t => t.Messages.Any() ? t.Messages.Max(m => m.SentAt) : t.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);

        return threads.Select(MapToResponse).ToList();
    }

    public async Task<ChatThreadResponse?> GetThreadAsync(int threadId, string userId, CancellationToken ct = default)
    {
        var thread = await db.ChatThreads
            .Include(t => t.Messages.OrderByDescending(m => m.SentAt).Take(50))
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == threadId, ct);

        if (thread is null || !thread.Participants.Contains(userId))
            return null;

        return MapToResponse(thread);
    }

    public async Task<MessageDto> SendMessageAsync(string senderId, SendMessageRequest request, CancellationToken ct = default)
    {
        var thread = await db.ChatThreads.FindAsync([request.ThreadId], ct)
            ?? throw new ArgumentException("Chat thread not found");

        if (!thread.Participants.Contains(senderId))
            throw new UnauthorizedAccessException("You are not a participant of this thread");

        var message = new Message
        {
            ThreadId = request.ThreadId,
            SenderId = senderId,
            Content = request.Content,
            AttachmentUrl = request.AttachmentUrl,
            SentAt = DateTime.UtcNow
        };

        db.Messages.Add(message);
        await db.SaveChangesAsync(ct);

        return new MessageDto(
            message.Id,
            message.ThreadId,
            message.SenderId,
            message.Content,
            message.AttachmentUrl,
            message.SentAt,
            message.ReadAt
        );
    }

    public async Task<List<MessageDto>> GetMessagesAsync(int threadId, string userId, CancellationToken ct = default)
    {
        var thread = await db.ChatThreads.FindAsync([threadId], ct);
        if (thread is null || !thread.Participants.Contains(userId))
            throw new UnauthorizedAccessException("Access denied");

        var messages = await db.Messages
            .Where(m => m.ThreadId == threadId)
            .OrderBy(m => m.SentAt)
            .AsNoTracking()
            .ToListAsync(ct);

        return messages.Select(m => new MessageDto(
            m.Id,
            m.ThreadId,
            m.SenderId,
            m.Content,
            m.AttachmentUrl,
            m.SentAt,
            m.ReadAt
        )).ToList();
    }

    private static ChatThreadResponse MapToResponse(ChatThread t)
    {
        var participants = string.IsNullOrEmpty(t.Participants)
            ? Array.Empty<string>()
            : t.Participants.Split(',', StringSplitOptions.RemoveEmptyEntries);

        var messages = t.Messages
            .OrderBy(m => m.SentAt)
            .Select(m => new MessageDto(
                m.Id,
                m.ThreadId,
                m.SenderId,
                m.Content,
                m.AttachmentUrl,
                m.SentAt,
                m.ReadAt
            ))
            .ToList();

        return new ChatThreadResponse(t.Id, t.BookingId, participants, t.CreatedAt, messages);
    }
}
