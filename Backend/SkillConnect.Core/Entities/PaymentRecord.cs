using SkillConnect.Core.Enums;

namespace SkillConnect.Core.Entities;

public class PaymentRecord
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "ETB";
    public string Provider { get; set; } = string.Empty;
    public string? ProviderRef { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public DateTime CreatedAt { get; set; }

    // Navigation
    public Booking Booking { get; set; } = null!;
}
