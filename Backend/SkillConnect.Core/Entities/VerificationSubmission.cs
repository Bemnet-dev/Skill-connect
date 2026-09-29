using SkillConnect.Core.Enums;

namespace SkillConnect.Core.Entities;

public class VerificationSubmission
{
    public int Id { get; set; }
    public int WorkerProfileId { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string DocumentUrl { get; set; } = string.Empty;
    public VerificationStatus Status { get; set; } = VerificationStatus.Pending;

    /// <summary>Better Auth user ID of the admin who reviewed this submission.</summary>
    public string? ReviewedBy { get; set; }

    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public WorkerProfile WorkerProfile { get; set; } = null!;
}
