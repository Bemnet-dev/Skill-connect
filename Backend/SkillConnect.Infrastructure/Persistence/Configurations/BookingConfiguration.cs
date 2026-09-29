using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkillConnect.Core.Entities;
using SkillConnect.Core.Enums;

namespace SkillConnect.Infrastructure.Persistence.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.ToTable("bookings");

        builder.HasKey(b => b.Id);
        builder.Property(b => b.Id).UseIdentityColumn();
        builder.Property(b => b.CustomerId).HasMaxLength(36).IsRequired();

        builder.Property(b => b.Status)
            .HasConversion(
                s => s.ToString().ToLowerInvariant(),
                v => Enum.Parse<BookingStatus>(v, ignoreCase: true)
            )
            .HasMaxLength(20);

        // One-to-one: Booking ← Quote
        builder.HasOne(b => b.Quote)
            .WithOne(q => q.Booking)
            .HasForeignKey<Booking>(b => b.QuoteId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.Customer)
            .WithMany(u => u.CustomerBookings)
            .HasForeignKey(b => b.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        // One-to-one with Review, ChatThread, PaymentRecord, Dispute
        builder.HasOne(b => b.Review)
            .WithOne(r => r.Booking)
            .HasForeignKey<Review>(r => r.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(b => b.ChatThread)
            .WithOne(ct => ct.Booking)
            .HasForeignKey<ChatThread>(ct => ct.BookingId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(b => b.PaymentRecord)
            .WithOne(pr => pr.Booking)
            .HasForeignKey<PaymentRecord>(pr => pr.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(b => b.Dispute)
            .WithOne(d => d.Booking)
            .HasForeignKey<Dispute>(d => d.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(b => b.CustomerId);
        builder.HasIndex(b => b.WorkerProfileId);
        builder.HasIndex(b => b.Status);
    }
}
