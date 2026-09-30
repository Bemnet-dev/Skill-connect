using Microsoft.EntityFrameworkCore;
using SkillConnect.Api.DTOs;
using SkillConnect.Core.Entities;
using SkillConnect.Infrastructure.Persistence;

namespace SkillConnect.Api.Services;

public interface IDisputeService
{
    Task<DisputeResponse> CreateAsync(string raisedBy, CreateDisputeRequest request, CancellationToken ct = default);
    Task<DisputeResponse?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<List<DisputeResponse>> GetByUserAsync(string userId, CancellationToken ct = default);
    Task<List<DisputeResponse>> GetOpenAsync(CancellationToken ct = default);
    Task<DisputeResponse?> ResolveAsync(int id, ResolveDisputeRequest request, CancellationToken ct = default);
}

public class DisputeService(AppDbContext db) : IDisputeService
{
    public async Task<DisputeResponse> CreateAsync(string raisedBy, CreateDisputeRequest request, CancellationToken ct = default)
    {
        var booking = await db.Bookings.FindAsync([request.BookingId], ct)
            ?? throw new ArgumentException("Booking not found");

        var dispute = new Dispute
        {
            BookingId = request.BookingId,
            RaisedBy = raisedBy,
            Reason = request.Reason,
            Status = "open",
            CreatedAt = DateTime.UtcNow
        };

        db.Disputes.Add(dispute);

        // Update booking status
        booking.Status = Core.Enums.BookingStatus.Disputed;

        await db.SaveChangesAsync(ct);
        return MapToResponse(dispute);
    }

    public async Task<DisputeResponse?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var dispute = await db.Disputes.FindAsync([id], ct);
        return dispute is null ? null : MapToResponse(dispute);
    }

    public async Task<List<DisputeResponse>> GetByUserAsync(string userId, CancellationToken ct = default)
    {
        var disputes = await db.Disputes
            .Where(d => d.RaisedBy == userId)
            .OrderByDescending(d => d.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);

        return disputes.Select(MapToResponse).ToList();
    }

    public async Task<List<DisputeResponse>> GetOpenAsync(CancellationToken ct = default)
    {
        var disputes = await db.Disputes
            .Where(d => d.Status == "open")
            .OrderBy(d => d.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);

        return disputes.Select(MapToResponse).ToList();
    }

    public async Task<DisputeResponse?> ResolveAsync(int id, ResolveDisputeRequest request, CancellationToken ct = default)
    {
        var dispute = await db.Disputes.FindAsync([id], ct);
        if (dispute is null) return null;

        dispute.Status = "resolved";
        dispute.Resolution = request.Resolution;
        await db.SaveChangesAsync(ct);

        return MapToResponse(dispute);
    }

    private static DisputeResponse MapToResponse(Dispute d)
    {
        return new DisputeResponse(
            d.Id,
            d.BookingId,
            d.RaisedBy,
            d.Reason,
            d.Status,
            d.Resolution,
            d.CreatedAt
        );
    }
}
