using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkillConnect.Core.Entities;

namespace SkillConnect.Infrastructure.Persistence.Configurations;

public class DisputeConfiguration : IEntityTypeConfiguration<Dispute>
{
    public void Configure(EntityTypeBuilder<Dispute> builder)
    {
        builder.ToTable("disputes");

        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).UseIdentityColumn();
        builder.Property(d => d.RaisedBy).HasMaxLength(36).IsRequired();
        builder.Property(d => d.Reason).HasMaxLength(2000).IsRequired();
        builder.Property(d => d.Status).HasMaxLength(50).IsRequired();
        builder.Property(d => d.Resolution).HasMaxLength(2000);

        builder.HasIndex(d => d.Status);
    }
}
