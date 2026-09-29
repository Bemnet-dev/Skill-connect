using SkillConnect.Core.Enums;

namespace SkillConnect.Core.Entities;

public class JobRequest
{
    public int Id { get; set; }
    public string CustomerId { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string Description { get; set; } = string.Empty;
    public double LocationLat { get; set; }
    public double LocationLng { get; set; }
    public string? Address { get; set; }
    public JobRequestStatus Status { get; set; } = JobRequestStatus.Open;
    public DateTime CreatedAt { get; set; }

    // Navigation
    public AppUser Customer { get; set; } = null!;
    public Category Category { get; set; } = null!;
    public ICollection<Quote> Quotes { get; set; } = [];
}
