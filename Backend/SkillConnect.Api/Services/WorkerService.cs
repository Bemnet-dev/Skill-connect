using Microsoft.EntityFrameworkCore;
using SkillConnect.Api.DTOs;
using SkillConnect.Core.Entities;
using SkillConnect.Infrastructure.Persistence;

namespace SkillConnect.Api.Services;

public interface IWorkerService
{
    Task<PagedResponse<WorkerSummaryResponse>> SearchAsync(WorkerSearchRequest request, CancellationToken ct = default);
    Task<WorkerDetailResponse?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<WorkerDetailResponse?> GetByUserIdAsync(string userId, CancellationToken ct = default);
}

public class WorkerService(AppDbContext db) : IWorkerService
{
    public async Task<PagedResponse<WorkerSummaryResponse>> SearchAsync(WorkerSearchRequest request, CancellationToken ct = default)
    {
        var query = db.WorkerProfiles
            .Include(w => w.User)
            .Include(w => w.PortfolioItems)
            .AsNoTracking()
            .AsQueryable();

        // Category filter
        if (!string.IsNullOrWhiteSpace(request.Category))
        {
            query = query.Where(w => w.CategoryIds.Contains(request.Category));
        }

        // Rating filter
        if (request.MinRating.HasValue)
        {
            query = query.Where(w => w.RatingAverage >= request.MinRating.Value);
        }

        // Verification filter
        if (request.IsVerified.HasValue)
        {
            query = query.Where(w => w.IsVerified == request.IsVerified.Value);
        }

        // Free-text search
        if (!string.IsNullOrWhiteSpace(request.Query))
        {
            var q = request.Query.ToLower();
            query = query.Where(w =>
                w.DisplayName.ToLower().Contains(q) ||
                (w.Bio != null && w.Bio.ToLower().Contains(q)) ||
                w.CategoryIds.ToLower().Contains(q));
        }

        // Geo filter (bounding box approximation)
        if (request.Latitude.HasValue && request.Longitude.HasValue)
        {
            var radiusKm = request.Radius ?? 25;
            var latDelta = radiusKm / 111.0;
            var lngDelta = radiusKm / (111.0 * Math.Cos(request.Latitude.Value * Math.PI / 180));

            query = query.Where(w =>
                w.LocationLat.HasValue && w.LocationLng.HasValue &&
                w.LocationLat >= request.Latitude.Value - latDelta &&
                w.LocationLat <= request.Latitude.Value + latDelta &&
                w.LocationLng >= request.Longitude.Value - lngDelta &&
                w.LocationLng <= request.Longitude.Value + lngDelta);
        }

        // Sorting
        query = request.SortBy switch
        {
            "rating" => query.OrderByDescending(w => w.RatingAverage),
            "price_low" => query.OrderBy(w => w.RatingAverage), // placeholder for price sorting
            "price_high" => query.OrderByDescending(w => w.RatingAverage),
            "distance" when request.Latitude.HasValue && request.Longitude.HasValue => query.OrderBy(w =>
                (w.LocationLat - request.Latitude.Value) * (w.LocationLat - request.Latitude.Value) +
                (w.LocationLng - request.Longitude.Value) * (w.LocationLng - request.Longitude.Value)),
            "reviews" => query.OrderByDescending(w => w.JobsCompleted),
            _ => query.OrderByDescending(w => w.RatingAverage)
        };

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        var responses = items.Select(w => MapToSummary(w, request.Latitude, request.Longitude)).ToList();

        return new PagedResponse<WorkerSummaryResponse>(
            responses,
            total,
            request.Page,
            request.PageSize,
            (int)Math.Ceiling(total / (double)request.PageSize),
            request.Page * request.PageSize < total
        );
    }

    public async Task<WorkerDetailResponse?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var worker = await db.WorkerProfiles
            .Include(w => w.User)
            .Include(w => w.PortfolioItems)
            .Include(w => w.Quotes)
                .ThenInclude(q => q.JobRequest)
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == id, ct);

        if (worker is null) return null;

        var reviews = await db.Reviews
            .Include(r => r.Reviewer)
            .Where(r => r.Booking.WorkerProfileId == id)
            .OrderByDescending(r => r.CreatedAt)
            .Take(10)
            .AsNoTracking()
            .ToListAsync(ct);

        return MapToDetail(worker, reviews);
    }

    public async Task<WorkerDetailResponse?> GetByUserIdAsync(string userId, CancellationToken ct = default)
    {
        var worker = await db.WorkerProfiles
            .Include(w => w.User)
            .Include(w => w.PortfolioItems)
            .FirstOrDefaultAsync(w => w.UserId == userId, ct);

        if (worker is null) return null;

        var reviews = await db.Reviews
            .Include(r => r.Reviewer)
            .Where(r => r.Booking.WorkerProfileId == worker.Id)
            .OrderByDescending(r => r.CreatedAt)
            .Take(10)
            .AsNoTracking()
            .ToListAsync(ct);

        return MapToDetail(worker, reviews);
    }

    private static WorkerSummaryResponse MapToSummary(WorkerProfile w, double? lat, double? lng)
    {
        double? distance = null;
        if (lat.HasValue && lng.HasValue && w.LocationLat.HasValue && w.LocationLng.HasValue)
        {
            distance = CalculateDistance(lat.Value, lng.Value, w.LocationLat.Value, w.LocationLng.Value);
        }

        var skills = string.IsNullOrEmpty(w.CategoryIds)
            ? Array.Empty<string>()
            : w.CategoryIds.Split(',', StringSplitOptions.RemoveEmptyEntries);

        return new WorkerSummaryResponse(
            w.Id,
            w.UserId,
            w.DisplayName,
            w.User?.Image,
            null, // headline not in entity yet
            w.Bio,
            skills.FirstOrDefault() ?? "general",
            skills,
            Array.Empty<string>(),
            w.RatingAverage,
            w.JobsCompleted,
            0, // hourlyRate not in entity yet
            "ETB",
            distance,
            w.ServiceRadiusKm,
            null, // location label not in entity yet
            w.IsVerified,
            "available_now",
            true,
            w.JobsCompleted,
            null,
            w.PortfolioItems.Select(p => new PortfolioItemDto(p.Id, p.ImageUrl, p.Caption)).ToList(),
            false
        );
    }

    private static WorkerDetailResponse MapToDetail(WorkerProfile w, List<Review> reviews)
    {
        var skills = string.IsNullOrEmpty(w.CategoryIds)
            ? Array.Empty<string>()
            : w.CategoryIds.Split(',', StringSplitOptions.RemoveEmptyEntries);

        return new WorkerDetailResponse(
            w.Id,
            w.UserId,
            w.DisplayName,
            w.User?.Image,
            null,
            w.Bio,
            skills.FirstOrDefault() ?? "general",
            skills,
            Array.Empty<string>(),
            w.RatingAverage,
            w.JobsCompleted,
            0,
            "ETB",
            w.ServiceRadiusKm,
            null,
            w.IsVerified,
            w.JobsCompleted,
            null,
            w.PortfolioItems.Select(p => new PortfolioItemDto(p.Id, p.ImageUrl, p.Caption)).ToList(),
            reviews.Select(r => new ReviewDto(
                r.Id,
                r.BookingId,
                r.ReviewerId,
                r.Reviewer?.Name ?? "Anonymous",
                r.Rating,
                r.Comment,
                r.CreatedAt
            )).ToList()
        );
    }

    private static double CalculateDistance(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371; // Earth's radius in km
        var dLat = ToRad(lat2 - lat1);
        var dLng = ToRad(lng2 - lng1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2)) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double ToRad(double deg) => deg * Math.PI / 180;
}
