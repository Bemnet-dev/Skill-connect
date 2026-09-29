using SkillConnect.Core.Enums;

namespace SkillConnect.Core.Entities;

/// <summary>
/// Mirror of the Better Auth `user` table row.
/// Better Auth owns this table — EF Core maps it read-only for foreign key joins.
/// The Id matches the string UUID Better Auth stores in the `user.id` column.
/// </summary>
public class AppUser
{
    public string Id { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string Email { get; set; } = string.Empty;
    public bool EmailVerified { get; set; }
    public string? Image { get; set; }
    public string? PhoneNumber { get; set; }
    public bool PhoneNumberVerified { get; set; }
    public UserRole Role { get; set; } = UserRole.Customer;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public WorkerProfile? WorkerProfile { get; set; }
    public ICollection<JobRequest> JobRequests { get; set; } = [];
    public ICollection<Booking> CustomerBookings { get; set; } = [];
    public ICollection<Review> Reviews { get; set; } = [];
    public ICollection<Notification> Notifications { get; set; } = [];
}
