namespace SkillConnect.Core.Entities;

public class Message
{
    public int Id { get; set; }
    public int ThreadId { get; set; }
    public string SenderId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public DateTime SentAt { get; set; }
    public DateTime? ReadAt { get; set; }

    // Navigation
    public ChatThread Thread { get; set; } = null!;
}
