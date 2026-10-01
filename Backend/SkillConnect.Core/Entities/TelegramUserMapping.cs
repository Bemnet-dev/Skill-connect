using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SkillConnect.Core.Entities;

/// <summary>
/// Maps Telegram user IDs to phone numbers for OTP delivery
/// </summary>
[Table("telegram_user_mappings")]
public class TelegramUserMapping
{
    [Key]
    [Column("telegram_user_id")]
    public long TelegramUserId { get; set; }

    [Required]
    [Column("phone_number")]
    [MaxLength(20)]
    public string PhoneNumber { get; set; } = string.Empty;

    [Column("language")]
    [MaxLength(5)]
    public string Language { get; set; } = "en";

    [Column("role")]
    [MaxLength(20)]
    public string? Role { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("expires_at")]
    public DateTime? ExpiresAt { get; set; }
}