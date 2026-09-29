using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkillConnect.Core.Entities;

namespace SkillConnect.Infrastructure.Persistence.Configurations;

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.ToTable("messages");

        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).UseIdentityColumn();
        builder.Property(m => m.SenderId).HasMaxLength(36).IsRequired();
        builder.Property(m => m.Content).HasMaxLength(4000).IsRequired();
        builder.Property(m => m.AttachmentUrl).HasMaxLength(1000);

        builder.HasIndex(m => m.ThreadId);
        builder.HasIndex(m => m.SentAt);
    }
}
