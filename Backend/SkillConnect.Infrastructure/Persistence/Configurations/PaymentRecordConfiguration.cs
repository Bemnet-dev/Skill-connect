using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkillConnect.Core.Entities;
using SkillConnect.Core.Enums;

namespace SkillConnect.Infrastructure.Persistence.Configurations;

public class PaymentRecordConfiguration : IEntityTypeConfiguration<PaymentRecord>
{
    public void Configure(EntityTypeBuilder<PaymentRecord> builder)
    {
        builder.ToTable("payment_records");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).UseIdentityColumn();
        builder.Property(p => p.Amount).HasPrecision(12, 2).IsRequired();
        builder.Property(p => p.Currency).HasMaxLength(3).IsRequired();
        builder.Property(p => p.Provider).HasMaxLength(100).IsRequired();
        builder.Property(p => p.ProviderRef).HasMaxLength(255);

        builder.Property(p => p.Status)
            .HasConversion(
                s => s.ToString().ToLowerInvariant(),
                v => Enum.Parse<PaymentStatus>(v, ignoreCase: true)
            )
            .HasMaxLength(20);

        builder.HasIndex(p => p.Status);
    }
}
