namespace SkillConnect.Core.Entities;

public class ChatThread
{
    public int Id { get; set; }
    public int? BookingId { get; set; }

    /// <summary>Comma-separated Better Auth user IDs of participants.</summary>
    public string Participants { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    // Navigation
    public Booking? Booking { get; set; }
    public ICollection<Message> Messages { get; set; } = [];
}
