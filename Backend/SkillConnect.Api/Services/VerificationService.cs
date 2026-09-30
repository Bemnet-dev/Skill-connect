using Microsoft.EntityFrameworkCore;
using SkillConnect.Api.DTOs;
using SkillConnect.Core.Entities;
using SkillConnect.Core.Enums;
using SkillConnect.Infrastructure.Persistence;

namespace SkillConnect.Api.Services;

public interface IVerificationService
{
    Task<VerificationSubmissionResponse> SubmitAsync(int workerProfileId, CreateVerificationRequest request, CancellationToken ct = default);
    Task<List<VerificationSubmissionResponse>> GetByWorkerAsync(int workerProfileId, CancellationToken ct = default);
    Task<List<VerificationSubmissionResponse>> GetPendingAsync(CancellationToken ct = default);
    Task<VerificationSubmissionResponse?> ReviewAsync(int id, string adminId, ReviewVerificationRequest request, CancellationToken ct = default);
}

public class VerificationService(AppDbContext db) : IVerificationService
{
    public async Task<VerificationSubmissionResponse> SubmitAsync(int workerProfileId, CreateVerificationRequest request, CancellationToken ct = default)
    {
        var submission = new VerificationSubmission
        {
            WorkerProfileId = workerProfileId,
            DocumentType = request.DocumentType,
            DocumentUrl = request.DocumentUrl,
            Status = VerificationStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        db.VerificationSubmissions.Add(submission);
        await db.SaveChangesAsync(ct);

        return MapToResponse(submission);
    }

    public async Task<List<VerificationSubmissionResponse>> GetByWorkerAsync(int workerProfileId, CancellationToken ct = default)
    {
        var submissions = await db.VerificationSubmissions
            .Where(v => v.WorkerProfileId == workerProfileId)
            .OrderByDescending(v => v.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);

        return submissions.Select(MapToResponse).ToList();
    }

    public async Task<List<VerificationSubmissionResponse>> GetPendingAsync(CancellationToken ct = default)
    {
        var submissions = await db.VerificationSubmissions
            .Where(v => v.Status == VerificationStatus.Pending)
            .OrderBy(v => v.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);

        return submissions.Select(MapToResponse).ToList();
    }

    public async Task<VerificationSubmissionResponse?> ReviewAsync(int id, string adminId, ReviewVerificationRequest request, CancellationToken ct = default)
    {
        var submission = await db.VerificationSubmissions.FindAsync([id], ct);
        if (submission is null) return null;

        submission.Status = request.Status;
        submission.ReviewedBy = adminId;
        submission.ReviewedAt = DateTime.UtcNow;

        // If approved, mark worker as verified
        if (request.Status == VerificationStatus.Approved)
        {
            var worker = await db.WorkerProfiles.FindAsync([submission.WorkerProfileId], ct);
            if (worker is not null)
                worker.IsVerified = true;
        }

        await db.SaveChangesAsync(ct);
        return MapToResponse(submission);
    }

    private static VerificationSubmissionResponse MapToResponse(VerificationSubmission v)
    {
        return new VerificationSubmissionResponse(
            v.Id,
            v.WorkerProfileId,
            v.DocumentType,
            v.DocumentUrl,
            v.Status,
            v.ReviewedBy,
            v.ReviewedAt,
            v.CreatedAt
        );
    }
}
