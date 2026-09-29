using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkillConnect.Core.Entities;
using SkillConnect.Core.Enums;

namespace SkillConnect.Infrastructure.Persistence.Configurations;

/// <summary>
/// Maps AppUser to the Better Auth `user` table.
/// Better Auth owns this table — we only map it for FK joins.
/// Column names must match exactly what Better Auth creates.
/// </summary>
public class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
{
    public void Configure(EntityTypeBuilder<AppUser> builder)
    {
        builder.ToTable("user");

        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).HasColumnName("id").HasMaxLength(36);
        builder.Property(u => u.Name).HasColumnName("name").HasMaxLength(255);
        builder.Property(u => u.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
        builder.Property(u => u.EmailVerified).HasColumnName("emailVerified");
        builder.Property(u => u.Image).HasColumnName("image");
        builder.Property(u => u.PhoneNumber).HasColumnName("phoneNumber").HasMaxLength(20);
        builder.Property(u => u.PhoneNumberVerified).HasColumnName("phoneNumberVerified");
        builder.Property(u => u.CreatedAt).HasColumnName("createdAt");
        builder.Property(u => u.UpdatedAt).HasColumnName("updatedAt");

        // Role is stored as a lowercase string in Better Auth
        builder.Property(u => u.Role)
            .HasColumnName("role")
            .HasMaxLength(20)
            .HasConversion(
                role => role.ToString().ToLowerInvariant(),
                value => Enum.Parse<UserRole>(value, ignoreCase: true)
            )
            .HasDefaultValue(UserRole.Customer);

        builder.HasIndex(u => u.Email).IsUnique();
        builder.HasIndex(u => u.PhoneNumber);

        // One-to-one with WorkerProfile
        builder.HasOne(u => u.WorkerProfile)
            .WithOne(w => w.User)
            .HasForeignKey<WorkerProfile>(w => w.UserId);
    }
}
