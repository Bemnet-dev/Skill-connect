using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkillConnect.Core.Entities;
using SkillConnect.Core.Enums;

namespace SkillConnect.Infrastructure.Persistence.Configurations;

public class JobRequestConfiguration : IEntityTypeConfiguration<JobRequest>
{
    public void Configure(EntityTypeBuilder<JobRequest> builder)
    {
        builder.ToTable("job_requests");

        builder.HasKey(j => j.Id);
        builder.Property(j => j.Id).UseIdentityColumn();
        builder.Property(j => j.CustomerId).HasMaxLength(36).IsRequired();
        builder.Property(j => j.Description).HasMaxLength(2000).IsRequired();
        builder.Property(j => j.Address).HasMaxLength(500);

        builder.Property(j => j.Status)
            .HasConversion(
                s => s.ToString().ToLowerInvariant(),
                v => Enum.Parse<JobRequestStatus>(v, ignoreCase: true)
            )
            .HasMaxLength(20);

        builder.HasOne(j => j.Customer)
            .WithMany(u => u.JobRequests)
            .HasForeignKey(j => j.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(j => j.Category)
            .WithMany(c => c.JobRequests)
            .HasForeignKey(j => j.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(j => j.Quotes)
            .WithOne(q => q.JobRequest)
            .HasForeignKey(q => q.JobRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(j => j.CustomerId);
        builder.HasIndex(j => j.Status);
    }
}
