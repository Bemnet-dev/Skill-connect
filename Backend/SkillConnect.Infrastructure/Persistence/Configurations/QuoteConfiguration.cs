using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkillConnect.Core.Entities;
using SkillConnect.Core.Enums;

namespace SkillConnect.Infrastructure.Persistence.Configurations;

public class QuoteConfiguration : IEntityTypeConfiguration<Quote>
{
    public void Configure(EntityTypeBuilder<Quote> builder)
    {
        builder.ToTable("quotes");

        builder.HasKey(q => q.Id);
        builder.Property(q => q.Id).UseIdentityColumn();
        builder.Property(q => q.Price).HasPrecision(12, 2).IsRequired();
        builder.Property(q => q.Currency).HasMaxLength(3).IsRequired();
        builder.Property(q => q.Message).HasMaxLength(1000);

        builder.Property(q => q.Status)
            .HasConversion(
                s => s.ToString().ToLowerInvariant(),
                v => Enum.Parse<QuoteStatus>(v, ignoreCase: true)
            )
            .HasMaxLength(20);

        builder.HasIndex(q => q.JobRequestId);
        builder.HasIndex(q => q.WorkerProfileId);
    }
}
