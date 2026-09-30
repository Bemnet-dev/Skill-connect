using System.ComponentModel.DataAnnotations;
using SkillConnect.Core.Enums;

namespace SkillConnect.Api.DTOs;

// ── Worker DTOs ──────────────────────────────────────────────────────────────

public record WorkerSearchRequest(
    string? Category,
    double? Latitude,
    double? Longitude,
    double? Radius,
    string? Availability,
    string? Query,
    double? MinRating,
    decimal? MinPrice,
    decimal? MaxPrice,
    bool? IsVerified,
    string? SortBy,
    int Page = 1,
    int PageSize = 20
);

public record WorkerSummaryResponse(
    int Id,
    string UserId,
    string Name,
    string? AvatarUrl,
    string? Headline,
    string? Bio,
    string Category,
    string[] Skills,
    string[] Languages,
    double Rating,
    int ReviewCount,
    decimal HourlyRate,
    string Currency,
    double? DistanceKm,
    int? ServiceRadiusKm,
    string? Location,
    bool IsVerified,
    string Availability,
    bool IsAvailable,
    int CompletedJobsCount,
    int? ResponseTimeMinutes,
    List<PortfolioItemDto> Portfolio,
    bool Featured
);

public record PortfolioItemDto(
    int Id,
    string ImageUrl,
    string? Caption
);

public record WorkerDetailResponse(
    int Id,
    string UserId,
    string Name,
    string? AvatarUrl,
    string? Headline,
    string? Bio,
    string Category,
    string[] Skills,
    string[] Languages,
    double Rating,
    int ReviewCount,
    decimal HourlyRate,
    string Currency,
    int? ServiceRadiusKm,
    string? Location,
    bool IsVerified,
    int CompletedJobsCount,
    int? ResponseTimeMinutes,
    List<PortfolioItemDto> Portfolio,
    List<ReviewDto> RecentReviews
);

// ── Category DTOs ────────────────────────────────────────────────────────────

public record CategoryResponse(
    int Id,
    string Name,
    string Slug,
    string? IconUrl
);

// ── Job Request DTOs ─────────────────────────────────────────────────────────

public record CreateJobRequestRequest(
    [Required] int CategoryId,
    [Required][StringLength(2000)] string Description,
    [Required] double LocationLat,
    [Required] double LocationLng,
    [StringLength(500)] string? Address
);

public record JobRequestResponse(
    int Id,
    string CustomerId,
    int CategoryId,
    string CategoryName,
    string Description,
    double LocationLat,
    double LocationLng,
    string? Address,
    JobRequestStatus Status,
    DateTime CreatedAt,
    List<QuoteSummaryDto> Quotes
);

public record QuoteSummaryDto(
    int Id,
    int WorkerProfileId,
    string WorkerName,
    decimal Price,
    string Currency,
    string? Message,
    QuoteStatus Status,
    DateTime? ExpiresAt
);

// ── Quote DTOs ───────────────────────────────────────────────────────────────

public record CreateQuoteRequest(
    [Required] int JobRequestId,
    [Required][Range(0.01, double.MaxValue)] decimal Price,
    [StringLength(1000)] string? Message,
    DateTime? ExpiresAt
);

public record QuoteResponse(
    int Id,
    int JobRequestId,
    int WorkerProfileId,
    string WorkerName,
    decimal Price,
    string Currency,
    string? Message,
    QuoteStatus Status,
    DateTime? ExpiresAt,
    DateTime CreatedAt
);

// ── Booking DTOs ─────────────────────────────────────────────────────────────

public record CreateBookingRequest(
    [Required] int QuoteId
);

public record BookingResponse(
    int Id,
    int QuoteId,
    string CustomerId,
    string CustomerName,
    int WorkerProfileId,
    string WorkerName,
    BookingStatus Status,
    DateTime? CheckInAt,
    DateTime? CheckOutAt,
    DateTime? CompletedAt,
    DateTime CreatedAt,
    QuoteSummaryDto? Quote,
    ReviewDto? Review,
    PaymentRecordDto? Payment
);

public record UpdateBookingStatusRequest(
    [Required] BookingStatus Status
);

// ── Review DTOs ──────────────────────────────────────────────────────────────

public record CreateReviewRequest(
    [Required] int BookingId,
    [Required][Range(1, 5)] int Rating,
    [StringLength(1000)] string? Comment
);

public record ReviewDto(
    int Id,
    int BookingId,
    string ReviewerId,
    string ReviewerName,
    int Rating,
    string? Comment,
    DateTime CreatedAt
);

// ── Chat DTOs ────────────────────────────────────────────────────────────────

public record CreateChatThreadRequest(
    int? BookingId,
    [Required] string[] ParticipantIds
);

public record ChatThreadResponse(
    int Id,
    int? BookingId,
    string[] ParticipantIds,
    DateTime CreatedAt,
    List<MessageDto> RecentMessages
);

public record SendMessageRequest(
    [Required] int ThreadId,
    [Required][StringLength(4000)] string Content,
    string? AttachmentUrl
);

public record MessageDto(
    int Id,
    int ThreadId,
    string SenderId,
    string Content,
    string? AttachmentUrl,
    DateTime SentAt,
    DateTime? ReadAt
);

// ── Notification DTOs ────────────────────────────────────────────────────────

public record NotificationResponse(
    int Id,
    string UserId,
    string Type,
    string Payload,
    DateTime? ReadAt,
    DateTime CreatedAt
);

public record MarkNotificationReadRequest(
    [Required] int[] NotificationIds
);

// ── Verification DTOs ────────────────────────────────────────────────────────

public record CreateVerificationRequest(
    [Required] string DocumentType,
    [Required] string DocumentUrl
);

public record VerificationSubmissionResponse(
    int Id,
    int WorkerProfileId,
    string DocumentType,
    string DocumentUrl,
    VerificationStatus Status,
    string? ReviewedBy,
    DateTime? ReviewedAt,
    DateTime CreatedAt
);

public record ReviewVerificationRequest(
    [Required] VerificationStatus Status,
    [StringLength(500)] string? Resolution
);

// ── Dispute DTOs ─────────────────────────────────────────────────────────────

public record CreateDisputeRequest(
    [Required] int BookingId,
    [Required][StringLength(1000)] string Reason
);

public record DisputeResponse(
    int Id,
    int BookingId,
    string RaisedBy,
    string Reason,
    string Status,
    string? Resolution,
    DateTime CreatedAt
);

public record ResolveDisputeRequest(
    [Required][StringLength(1000)] string Resolution
);

// ── Payment DTOs ─────────────────────────────────────────────────────────────

public record CreatePaymentRequest(
    [Required] int BookingId,
    [Required][Range(0.01, double.MaxValue)] decimal Amount,
    [Required] string Provider
);

public record PaymentRecordDto(
    int Id,
    int BookingId,
    decimal Amount,
    string Currency,
    string Provider,
    string? ProviderRef,
    PaymentStatus Status,
    DateTime CreatedAt
);

// ── Auth DTOs ────────────────────────────────────────────────────────────────

public record CurrentUserResponse(
    string Id,
    string Email,
    string? Name,
    string? PhoneNumber,
    UserRole Role,
    string? SessionId
);

// ── Pagination ───────────────────────────────────────────────────────────────

public record PagedResponse<T>(
    List<T> Items,
    int Total,
    int Page,
    int PageSize,
    int TotalPages,
    bool HasMore
);
