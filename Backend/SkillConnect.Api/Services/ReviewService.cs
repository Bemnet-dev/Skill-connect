using Microsoft.EntityFrameworkCore;
using SkillConnect.Api.DTOs;
using SkillConnect.Core.Entities;
using SkillConnect.Infrastructure.Persistence;

namespace SkillConnect.Api.Services;

public interface IReviewService
{
    Task<ReviewDto> CreateAsync(string reviewerId, CreateReviewRequest request, CancellationToken ct = default);
    Task<List<ReviewDto>> GetByWorkerAsync(int workerProfileId, CancellationToken ct = default);
    Task<List<ReviewDto>> GetByBookingAsync(int bookingId, CancellationToken ct = default);
}

public class ReviewService(AppDbContext db) : IReviewService
{
    public async Task<ReviewDto> CreateAsync(string reviewerId, CreateReviewRequest request, CancellationToken ct = default)
    {
        var booking = await db.Bookings.FindAsync([request.BookingId], ct)
            ?? throw new ArgumentException("Booking not found");

        if (booking.CustomerId != reviewerId)
            throw new UnauthorizedAccessException("Only the customer can review this booking");

        if (booking.Status != Core.Enums.BookingStatus.Completed)
            throw new InvalidOperationException("Can only review completed bookings");

        var review = new Review
        {
            BookingId = request.BookingId,
            ReviewerId = reviewerId,
            Rating = request.Rating,
            Comment = request.Comment,
            CreatedAt = DateTime.UtcNow
        };

        db.Reviews.Add(review);

        // Update worker rating average
        var worker = await db.WorkerProfiles.FindAsync([booking.WorkerProfileId], ct);
        if (worker is not null)
        {
            var allReviews = await db.Reviews
                .Where(r => r.Booking.WorkerProfileId == booking.WorkerProfileId)
                .ToListAsync(ct);
            worker.RatingAverage = allReviews.Count > 0
                ? allReviews.Average(r => r.Rating)
                : request.Rating;
        }

        await db.SaveChangesAsync(ct);
        return MapToDto(review);
    }

    public async Task<List<ReviewDto>> GetByWorkerAsync(int workerProfileId, CancellationToken ct = default)
    {
        var reviews = await db.Reviews
            .Include(r => r.Reviewer)
            .Where(r => r.Booking.WorkerProfileId == workerProfileId)
            .OrderByDescending(r => r.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);

        return reviews.Select(MapToDto).ToList();
    }

    public async Task<List<ReviewDto>> GetByBookingAsync(int bookingId, CancellationToken ct = default)
    {
        var reviews = await db.Reviews
            .Include(r => r.Reviewer)
            .Where(r => r.BookingId == bookingId)
            .AsNoTracking()
            .ToListAsync(ct);

        return reviews.Select(MapToDto).ToList();
    }

    private static ReviewDto MapToDto(Review r)
    {
        return new ReviewDto(
            r.Id,
            r.BookingId,
            r.ReviewerId,
            r.Reviewer?.Name ?? "Anonymous",
            r.Rating,
            r.Comment,
            r.CreatedAt
        );
    }
}
