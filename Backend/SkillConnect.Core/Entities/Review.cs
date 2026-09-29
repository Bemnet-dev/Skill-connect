namespace SkillConnect.Core.Entities;

public class Review
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public string ReviewerId { get; set; } = string.Empty;

    /// <summary>Rating from 1 to 5.</summary>
    public int Rating { get; set; }

    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public Booking Booking { get; set; } = null!;
    public AppUser Reviewer { get; set; } = null!;
}
