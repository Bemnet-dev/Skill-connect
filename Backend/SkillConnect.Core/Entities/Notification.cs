namespace SkillConnect.Core.Entities;

public class Notification
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;

    /// <summary>Arbitrary JSON payload stored as text.</summary>
    public string Payload { get; set; } = "{}";

    public DateTime? ReadAt { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public AppUser User { get; set; } = null!;
}
