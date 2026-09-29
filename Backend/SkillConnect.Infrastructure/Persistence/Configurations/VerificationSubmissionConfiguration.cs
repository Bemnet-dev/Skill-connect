using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkillConnect.Core.Entities;
using SkillConnect.Core.Enums;

namespace SkillConnect.Infrastructure.Persistence.Configurations;

public class VerificationSubmissionConfiguration : IEntityTypeConfiguration<VerificationSubmission>
{
    public void Configure(EntityTypeBuilder<VerificationSubmission> builder)
    {
        builder.ToTable("verification_submissions");

        builder.HasKey(v => v.Id);
        builder.Property(v => v.Id).UseIdentityColumn();
        builder.Property(v => v.DocumentType).HasMaxLength(100).IsRequired();
        builder.Property(v => v.DocumentUrl).HasMaxLength(1000).IsRequired();
        builder.Property(v => v.ReviewedBy).HasMaxLength(36);

        builder.Property(v => v.Status)
            .HasConversion(
                s => s.ToString().ToLowerInvariant(),
                v => Enum.Parse<VerificationStatus>(v, ignoreCase: true)
            )
            .HasMaxLength(20);

        builder.HasIndex(v => v.WorkerProfileId);
        builder.HasIndex(v => v.Status);
    }
}
