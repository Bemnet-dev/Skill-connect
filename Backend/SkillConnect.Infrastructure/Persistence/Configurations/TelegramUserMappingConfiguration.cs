using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkillConnect.Core.Entities;

namespace SkillConnect.Infrastructure.Persistence.Configurations;

public class TelegramUserMappingConfiguration : IEntityTypeConfiguration<TelegramUserMapping>
{
    public void Configure(EntityTypeBuilder<TelegramUserMapping> builder)
    {
        builder.HasKey(x => x.TelegramUserId);

        builder.Property(x => x.PhoneNumber)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(x => x.Language)
            .HasMaxLength(5)
            .HasDefaultValue("en");

        builder.Property(x => x.Role)
            .HasMaxLength(20);

        builder.Property(x => x.CreatedAt)
            .HasDefaultValueSql("NOW()");

        builder.Property(x => x.UpdatedAt)
            .HasDefaultValueSql("NOW()");

        builder.HasIndex(x => x.PhoneNumber)
            .IsUnique(false);

        builder.HasIndex(x => x.ExpiresAt);
    }
}