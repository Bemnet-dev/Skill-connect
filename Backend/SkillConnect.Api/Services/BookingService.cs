using Microsoft.EntityFrameworkCore;
using SkillConnect.Api.DTOs;
using SkillConnect.Core.Entities;
using SkillConnect.Core.Enums;
using SkillConnect.Infrastructure.Persistence;

namespace SkillConnect.Api.Services;

public interface IBookingService
{
    Task<BookingResponse> CreateAsync(string customerId, CreateBookingRequest request, CancellationToken ct = default);
    Task<BookingResponse?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<List<BookingResponse>> GetByCustomerAsync(string customerId, CancellationToken ct = default);
    Task<List<BookingResponse>> GetByWorkerAsync(int workerProfileId, CancellationToken ct = default);
    Task<BookingResponse?> UpdateStatusAsync(int id, BookingStatus status, CancellationToken ct = default);
}

public class BookingService(AppDbContext db) : IBookingService
{
    public async Task<BookingResponse> CreateAsync(string customerId, CreateBookingRequest request, CancellationToken ct = default)
    {
        var quote = await db.Quotes
            .Include(q => q.WorkerProfile)
            .FirstOrDefaultAsync(q => q.Id == request.QuoteId, ct)
            ?? throw new ArgumentException("Quote not found");

        if (quote.Status != QuoteStatus.Pending)
            throw new InvalidOperationException("Quote is not in a pending state");

        var booking = new Booking
        {
            QuoteId = quote.Id,
            CustomerId = customerId,
            WorkerProfileId = quote.WorkerProfileId,
            Status = BookingStatus.Confirmed,
            CreatedAt = DateTime.UtcNow
        };

        // Accept the quote
        quote.Status = QuoteStatus.Accepted;

        // Update job request status
        var jobRequest = await db.JobRequests.FindAsync([quote.JobRequestId], ct);
        if (jobRequest is not null)
        {
            jobRequest.Status = JobRequestStatus.Accepted;
        }

        db.Bookings.Add(booking);
        await db.SaveChangesAsync(ct);

        return await MapToResponse(booking, ct);
    }

    public async Task<BookingResponse?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var booking = await db.Bookings
            .Include(b => b.Quote)
                .ThenInclude(q => q!.WorkerProfile)
            .Include(b => b.Customer)
            .Include(b => b.WorkerProfile)
                .ThenInclude(w => w!.User)
            .Include(b => b.Review)
            .Include(b => b.PaymentRecord)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id, ct);

        return booking is null ? null : await MapToResponse(booking, ct);
    }

    public async Task<List<BookingResponse>> GetByCustomerAsync(string customerId, CancellationToken ct = default)
    {
        var bookings = await db.Bookings
            .Include(b => b.Quote)
                .ThenInclude(q => q!.WorkerProfile)
            .Include(b => b.WorkerProfile)
                .ThenInclude(w => w!.User)
            .Include(b => b.Review)
            .Include(b => b.PaymentRecord)
            .Where(b => b.CustomerId == customerId)
            .OrderByDescending(b => b.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);

        var responses = new List<BookingResponse>();
        foreach (var b in bookings)
            responses.Add(await MapToResponse(b, ct));
        return responses;
    }

    public async Task<List<BookingResponse>> GetByWorkerAsync(int workerProfileId, CancellationToken ct = default)
    {
        var bookings = await db.Bookings
            .Include(b => b.Quote)
                .ThenInclude(q => q!.WorkerProfile)
            .Include(b => b.Customer)
            .Include(b => b.Review)
            .Include(b => b.PaymentRecord)
            .Where(b => b.WorkerProfileId == workerProfileId)
            .OrderByDescending(b => b.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);

        var responses = new List<BookingResponse>();
        foreach (var b in bookings)
            responses.Add(await MapToResponse(b, ct));
        return responses;
    }

    public async Task<BookingResponse?> UpdateStatusAsync(int id, BookingStatus status, CancellationToken ct = default)
    {
        var booking = await db.Bookings.FindAsync([id], ct);
        if (booking is null) return null;

        booking.Status = status;

        if (status == BookingStatus.InProgress && booking.CheckInAt is null)
            booking.CheckInAt = DateTime.UtcNow;

        if (status == BookingStatus.Completed)
        {
            booking.CheckOutAt = DateTime.UtcNow;
            booking.CompletedAt = DateTime.UtcNow;

            // Increment worker's completed jobs count
            var worker = await db.WorkerProfiles.FindAsync([booking.WorkerProfileId], ct);
            if (worker is not null)
                worker.JobsCompleted++;
        }

        await db.SaveChangesAsync(ct);
        return await MapToResponse(booking, ct);
    }

    private async Task<BookingResponse> MapToResponse(Booking b, CancellationToken ct)
    {
        var quote = await db.Quotes
            .Include(q => q!.WorkerProfile)
            .AsNoTracking()
            .FirstOrDefaultAsync(q => q.Id == b.QuoteId, ct);

        return new BookingResponse(
            b.Id,
            b.QuoteId,
            b.CustomerId,
            b.Customer?.Name ?? "Unknown",
            b.WorkerProfileId,
            b.WorkerProfile?.User?.Name ?? b.WorkerProfile?.DisplayName ?? "Unknown",
            b.Status,
            b.CheckInAt,
            b.CheckOutAt,
            b.CompletedAt,
            b.CreatedAt,
            quote is null ? null : new QuoteSummaryDto(
                quote.Id,
                quote.WorkerProfileId,
                quote.WorkerProfile?.DisplayName ?? "Unknown",
                quote.Price,
                quote.Currency,
                quote.Message,
                quote.Status,
                quote.ExpiresAt
            ),
            b.Review is null ? null : new ReviewDto(
                b.Review.Id,
                b.Review.BookingId,
                b.Review.ReviewerId,
                b.Review.Reviewer?.Name ?? "Anonymous",
                b.Review.Rating,
                b.Review.Comment,
                b.Review.CreatedAt
            ),
            b.PaymentRecord is null ? null : new PaymentRecordDto(
                b.PaymentRecord.Id,
                b.PaymentRecord.BookingId,
                b.PaymentRecord.Amount,
                b.PaymentRecord.Currency,
                b.PaymentRecord.Provider,
                b.PaymentRecord.ProviderRef,
                b.PaymentRecord.Status,
                b.PaymentRecord.CreatedAt
            )
        );
    }
}
