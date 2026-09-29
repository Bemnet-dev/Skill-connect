using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkillConnect.Core.Entities;

namespace SkillConnect.Infrastructure.Persistence.Configurations;

public class ChatThreadConfiguration : IEntityTypeConfiguration<ChatThread>
{
    public void Configure(EntityTypeBuilder<ChatThread> builder)
    {
        builder.ToTable("chat_threads");

        builder.HasKey(ct => ct.Id);
        builder.Property(ct => ct.Id).UseIdentityColumn();
        builder.Property(ct => ct.Participants).HasMaxLength(500).IsRequired();

        builder.HasMany(ct => ct.Messages)
            .WithOne(m => m.Thread)
            .HasForeignKey(m => m.ThreadId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
