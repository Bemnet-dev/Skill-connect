namespace SkillConnect.Core.Entities;

public class WorkerProfile
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Bio { get; set; }

    /// <summary>Comma-separated category slugs the worker offers.</summary>
    public string CategoryIds { get; set; } = string.Empty;

    public int ServiceRadiusKm { get; set; }
    public double RatingAverage { get; set; }
    public int JobsCompleted { get; set; }
    public bool IsVerified { get; set; }

    // Location stored as separate lat/lng columns (no PostGIS dependency for v1)
    public double? LocationLat { get; set; }
    public double? LocationLng { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public AppUser User { get; set; } = null!;
    public ICollection<PortfolioItem> PortfolioItems { get; set; } = [];
    public ICollection<Quote> Quotes { get; set; } = [];
    public ICollection<Booking> WorkerBookings { get; set; } = [];
    public ICollection<VerificationSubmission> VerificationSubmissions { get; set; } = [];
}
