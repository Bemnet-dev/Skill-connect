using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkillConnect.Core.Entities;

namespace SkillConnect.Infrastructure.Persistence.Configurations;

public class WorkerProfileConfiguration : IEntityTypeConfiguration<WorkerProfile>
{
    public void Configure(EntityTypeBuilder<WorkerProfile> builder)
    {
        builder.ToTable("worker_profiles");

        builder.HasKey(w => w.Id);
        builder.Property(w => w.Id).UseIdentityColumn();
        builder.Property(w => w.UserId).HasMaxLength(36).IsRequired();
        builder.Property(w => w.DisplayName).HasMaxLength(255).IsRequired();
        builder.Property(w => w.Bio).HasMaxLength(2000);
        builder.Property(w => w.CategoryIds).HasMaxLength(500).IsRequired();
        builder.Property(w => w.RatingAverage).HasPrecision(3, 2);

        builder.HasIndex(w => w.UserId).IsUnique();

        // Portfolios
        builder.HasMany(w => w.PortfolioItems)
            .WithOne(p => p.WorkerProfile)
            .HasForeignKey(p => p.WorkerProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        // Quotes submitted by this worker
        builder.HasMany(w => w.Quotes)
            .WithOne(q => q.WorkerProfile)
            .HasForeignKey(q => q.WorkerProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        // Bookings where this worker is assigned
        builder.HasMany(w => w.WorkerBookings)
            .WithOne(b => b.WorkerProfile)
            .HasForeignKey(b => b.WorkerProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        // Verification submissions
        builder.HasMany(w => w.VerificationSubmissions)
            .WithOne(v => v.WorkerProfile)
            .HasForeignKey(v => v.WorkerProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
