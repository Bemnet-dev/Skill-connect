using Microsoft.EntityFrameworkCore;
using SkillConnect.Api.DTOs;
using SkillConnect.Core.Entities;
using SkillConnect.Core.Enums;
using SkillConnect.Infrastructure.Persistence;

namespace SkillConnect.Api.Services;

public interface IJobRequestService
{
    Task<JobRequestResponse> CreateAsync(string customerId, CreateJobRequestRequest request, CancellationToken ct = default);
    Task<JobRequestResponse?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<List<JobRequestResponse>> GetByCustomerAsync(string customerId, CancellationToken ct = default);
    Task<List<JobRequestResponse>> GetOpenAsync(CancellationToken ct = default);
    Task<JobRequestResponse?> UpdateStatusAsync(int id, JobRequestStatus status, CancellationToken ct = default);
}

public class JobRequestService(AppDbContext db) : IJobRequestService
{
    public async Task<JobRequestResponse> CreateAsync(string customerId, CreateJobRequestRequest request, CancellationToken ct = default)
    {
        var jobRequest = new JobRequest
        {
            CustomerId = customerId,
            CategoryId = request.CategoryId,
            Description = request.Description,
            LocationLat = request.LocationLat,
            LocationLng = request.LocationLng,
            Address = request.Address,
            Status = JobRequestStatus.Open,
            CreatedAt = DateTime.UtcNow
        };

        db.JobRequests.Add(jobRequest);
        await db.SaveChangesAsync(ct);
        return MapToResponse(jobRequest);
    }

    public async Task<JobRequestResponse?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var jobRequest = await db.JobRequests
            .Include(j => j.Category)
            .Include(j => j.Quotes)
                .ThenInclude(q => q.WorkerProfile)
            .AsNoTracking()
            .FirstOrDefaultAsync(j => j.Id == id, ct);

        return jobRequest is null ? null : MapToResponse(jobRequest);
    }

    public async Task<List<JobRequestResponse>> GetByCustomerAsync(string customerId, CancellationToken ct = default)
    {
        var jobRequests = await db.JobRequests
            .Include(j => j.Category)
            .Include(j => j.Quotes)
                .ThenInclude(q => q.WorkerProfile)
            .Where(j => j.CustomerId == customerId)
            .OrderByDescending(j => j.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);

        return jobRequests.Select(MapToResponse).ToList();
    }

    public async Task<List<JobRequestResponse>> GetOpenAsync(CancellationToken ct = default)
    {
        var jobRequests = await db.JobRequests
            .Include(j => j.Category)
            .Include(j => j.Quotes)
                .ThenInclude(q => q.WorkerProfile)
            .Where(j => j.Status == JobRequestStatus.Open)
            .OrderByDescending(j => j.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);

        return jobRequests.Select(MapToResponse).ToList();
    }

    public async Task<JobRequestResponse?> UpdateStatusAsync(int id, JobRequestStatus status, CancellationToken ct = default)
    {
        var jobRequest = await db.JobRequests.FindAsync([id], ct);
        if (jobRequest is null) return null;

        jobRequest.Status = status;
        await db.SaveChangesAsync(ct);
        return MapToResponse(jobRequest);
    }

    private static JobRequestResponse MapToResponse(JobRequest j)
    {
        return new JobRequestResponse(
            j.Id,
            j.CustomerId,
            j.CategoryId,
            j.Category?.Name ?? "Unknown",
            j.Description,
            j.LocationLat,
            j.LocationLng,
            j.Address,
            j.Status,
            j.CreatedAt,
            j.Quotes.Select(q => new QuoteSummaryDto(
                q.Id,
                q.WorkerProfileId,
                q.WorkerProfile?.DisplayName ?? "Unknown",
                q.Price,
                q.Currency,
                q.Message,
                q.Status,
                q.ExpiresAt
            )).ToList()
        );
    }
}
