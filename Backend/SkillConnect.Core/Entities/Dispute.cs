namespace SkillConnect.Core.Entities;

public class Dispute
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public string RaisedBy { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "open";
    public string? Resolution { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public Booking Booking { get; set; } = null!;
}
