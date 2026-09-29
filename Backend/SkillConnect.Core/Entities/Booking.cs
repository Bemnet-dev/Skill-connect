using SkillConnect.Core.Enums;

namespace SkillConnect.Core.Entities;

public class Booking
{
    public int Id { get; set; }
    public int QuoteId { get; set; }
    public string CustomerId { get; set; } = string.Empty;
    public int WorkerProfileId { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Confirmed;
    public DateTime? CheckInAt { get; set; }
    public DateTime? CheckOutAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public Quote Quote { get; set; } = null!;
    public AppUser Customer { get; set; } = null!;
    public WorkerProfile WorkerProfile { get; set; } = null!;
    public Review? Review { get; set; }
    public ChatThread? ChatThread { get; set; }
    public PaymentRecord? PaymentRecord { get; set; }
    public Dispute? Dispute { get; set; }
}
