using Microsoft.EntityFrameworkCore;
using SkillConnect.Api.DTOs;
using SkillConnect.Core.Entities;
using SkillConnect.Core.Enums;
using SkillConnect.Infrastructure.Persistence;

namespace SkillConnect.Api.Services;

public interface IPaymentService
{
    Task<PaymentRecordDto> CreateAsync(CreatePaymentRequest request, CancellationToken ct = default);
    Task<PaymentRecordDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<List<PaymentRecordDto>> GetByBookingAsync(int bookingId, CancellationToken ct = default);
    Task<List<PaymentRecordDto>> GetByWorkerAsync(int workerProfileId, CancellationToken ct = default);
    Task<PaymentRecordDto?> UpdateStatusAsync(int id, PaymentStatus status, CancellationToken ct = default);
}

public class PaymentService(AppDbContext db) : IPaymentService
{
    public async Task<PaymentRecordDto> CreateAsync(CreatePaymentRequest request, CancellationToken ct = default)
    {
        var booking = await db.Bookings.FindAsync([request.BookingId], ct)
            ?? throw new ArgumentException("Booking not found");

        var payment = new PaymentRecord
        {
            BookingId = request.BookingId,
            Amount = request.Amount,
            Currency = "ETB",
            Provider = request.Provider,
            Status = PaymentStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        db.PaymentRecords.Add(payment);
        await db.SaveChangesAsync(ct);

        return MapToDto(payment);
    }

    public async Task<PaymentRecordDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var payment = await db.PaymentRecords.FindAsync([id], ct);
        return payment is null ? null : MapToDto(payment);
    }

    public async Task<List<PaymentRecordDto>> GetByBookingAsync(int bookingId, CancellationToken ct = default)
    {
        var payments = await db.PaymentRecords
            .Where(p => p.BookingId == bookingId)
            .AsNoTracking()
            .ToListAsync(ct);

        return payments.Select(MapToDto).ToList();
    }

    public async Task<List<PaymentRecordDto>> GetByWorkerAsync(int workerProfileId, CancellationToken ct = default)
    {
        var payments = await db.PaymentRecords
            .Include(p => p.Booking)
            .Where(p => p.Booking.WorkerProfileId == workerProfileId)
            .OrderByDescending(p => p.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);

        return payments.Select(MapToDto).ToList();
    }

    public async Task<PaymentRecordDto?> UpdateStatusAsync(int id, PaymentStatus status, CancellationToken ct = default)
    {
        var payment = await db.PaymentRecords.FindAsync([id], ct);
        if (payment is null) return null;

        payment.Status = status;
        await db.SaveChangesAsync(ct);
        return MapToDto(payment);
    }

    private static PaymentRecordDto MapToDto(PaymentRecord p)
    {
        return new PaymentRecordDto(
            p.Id,
            p.BookingId,
            p.Amount,
            p.Currency,
            p.Provider,
            p.ProviderRef,
            p.Status,
            p.CreatedAt
        );
    }
}
