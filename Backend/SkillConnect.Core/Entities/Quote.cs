using SkillConnect.Core.Enums;

namespace SkillConnect.Core.Entities;

public class Quote
{
    public int Id { get; set; }
    public int JobRequestId { get; set; }
    public int WorkerProfileId { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "ETB";
    public string? Message { get; set; }
    public QuoteStatus Status { get; set; } = QuoteStatus.Pending;
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public JobRequest JobRequest { get; set; } = null!;
    public WorkerProfile WorkerProfile { get; set; } = null!;
    public Booking? Booking { get; set; }
}
