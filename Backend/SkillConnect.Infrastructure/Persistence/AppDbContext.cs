using Microsoft.EntityFrameworkCore;
using SkillConnect.Core.Entities;
using SkillConnect.Core.Enums;

namespace SkillConnect.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // ── Better Auth tables (read-only mirror — Better Auth owns these) ──────
    public DbSet<AppUser> Users => Set<AppUser>();

    // ── Domain tables ────────────────────────────────────────────────────────
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<WorkerProfile> WorkerProfiles => Set<WorkerProfile>();
    public DbSet<PortfolioItem> PortfolioItems => Set<PortfolioItem>();
    public DbSet<JobRequest> JobRequests => Set<JobRequest>();
    public DbSet<Quote> Quotes => Set<Quote>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<ChatThread> ChatThreads => Set<ChatThread>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<VerificationSubmission> VerificationSubmissions => Set<VerificationSubmission>();
    public DbSet<Dispute> Disputes => Set<Dispute>();
    public DbSet<PaymentRecord> PaymentRecords => Set<PaymentRecord>();
    public DbSet<TelegramUserMapping> TelegramUserMappings => Set<TelegramUserMapping>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Exclude the Better Auth `user` table from migrations — Better Auth owns it
        modelBuilder.Entity<AppUser>().ToTable("user", t => t.ExcludeFromMigrations());

        // Apply all IEntityTypeConfiguration<T> classes in this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
