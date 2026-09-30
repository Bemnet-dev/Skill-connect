using Microsoft.EntityFrameworkCore;
using SkillConnect.Api.DTOs;
using SkillConnect.Core.Entities;
using SkillConnect.Core.Enums;
using SkillConnect.Infrastructure.Persistence;

namespace SkillConnect.Api.Services;

public interface IQuoteService
{
    Task<QuoteResponse> CreateAsync(int workerProfileId, CreateQuoteRequest request, CancellationToken ct = default);
    Task<QuoteResponse?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<List<QuoteResponse>> GetByWorkerAsync(int workerProfileId, CancellationToken ct = default);
    Task<List<QuoteResponse>> GetByJobRequestAsync(int jobRequestId, CancellationToken ct = default);
    Task<QuoteResponse?> UpdateStatusAsync(int id, QuoteStatus status, CancellationToken ct = default);
}

public class QuoteService(AppDbContext db) : IQuoteService
{
    public async Task<QuoteResponse> CreateAsync(int workerProfileId, CreateQuoteRequest request, CancellationToken ct = default)
    {
        var quote = new Quote
        {
            JobRequestId = request.JobRequestId,
            WorkerProfileId = workerProfileId,
            Price = request.Price,
            Currency = "ETB",
            Message = request.Message,
            Status = QuoteStatus.Pending,
            ExpiresAt = request.ExpiresAt ?? DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };

        db.Quotes.Add(quote);

        // Update job request status to Quoted
        var jobRequest = await db.JobRequests.FindAsync([request.JobRequestId], ct);
        if (jobRequest is not null && jobRequest.Status == JobRequestStatus.Open)
        {
            jobRequest.Status = JobRequestStatus.Quoted;
        }

        await db.SaveChangesAsync(ct);
        return MapToResponse(quote);
    }

    public async Task<QuoteResponse?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var quote = await db.Quotes
            .Include(q => q.WorkerProfile)
            .AsNoTracking()
            .FirstOrDefaultAsync(q => q.Id == id, ct);

        return quote is null ? null : MapToResponse(quote);
    }

    public async Task<List<QuoteResponse>> GetByWorkerAsync(int workerProfileId, CancellationToken ct = default)
    {
        var quotes = await db.Quotes
            .Include(q => q.WorkerProfile)
            .Where(q => q.WorkerProfileId == workerProfileId)
            .OrderByDescending(q => q.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);

        return quotes.Select(MapToResponse).ToList();
    }

    public async Task<List<QuoteResponse>> GetByJobRequestAsync(int jobRequestId, CancellationToken ct = default)
    {
        var quotes = await db.Quotes
            .Include(q => q.WorkerProfile)
            .Where(q => q.JobRequestId == jobRequestId)
            .OrderBy(q => q.Price)
            .AsNoTracking()
            .ToListAsync(ct);

        return quotes.Select(MapToResponse).ToList();
    }

    public async Task<QuoteResponse?> UpdateStatusAsync(int id, QuoteStatus status, CancellationToken ct = default)
    {
        var quote = await db.Quotes.FindAsync([id], ct);
        if (quote is null) return null;

        quote.Status = status;
        await db.SaveChangesAsync(ct);
        return MapToResponse(quote);
    }

    private static QuoteResponse MapToResponse(Quote q)
    {
        return new QuoteResponse(
            q.Id,
            q.JobRequestId,
            q.WorkerProfileId,
            q.WorkerProfile?.DisplayName ?? "Unknown",
            q.Price,
            q.Currency,
            q.Message,
            q.Status,
            q.ExpiresAt,
            q.CreatedAt
        );
    }
}
