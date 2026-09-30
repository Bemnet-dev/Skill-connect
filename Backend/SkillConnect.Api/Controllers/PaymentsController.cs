using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillConnect.Api.DTOs;
using SkillConnect.Api.Services;
using SkillConnect.Core.Enums;

namespace SkillConnect.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController(IPaymentService paymentService) : ControllerBase
{
    /// <summary>
    /// Create a payment record for a booking.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<PaymentRecordDto>> Create(
        [FromBody] CreatePaymentRequest request,
        CancellationToken ct)
    {
        try
        {
            var payment = await paymentService.CreateAsync(request, ct);
            return CreatedAtAction(nameof(GetById), new { id = payment.Id }, payment);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get a payment by ID.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<PaymentRecordDto>> GetById(int id, CancellationToken ct)
    {
        var payment = await paymentService.GetByIdAsync(id, ct);
        return payment is null ? NotFound() : Ok(payment);
    }

    /// <summary>
    /// Get all payments for a booking.
    /// </summary>
    [HttpGet("booking/{bookingId:int}")]
    public async Task<ActionResult<List<PaymentRecordDto>>> GetByBooking(int bookingId, CancellationToken ct)
    {
        var payments = await paymentService.GetByBookingAsync(bookingId, ct);
        return Ok(payments);
    }

    /// <summary>
    /// Get all payments for a worker.
    /// </summary>
    [HttpGet("worker/{workerProfileId:int}")]
    public async Task<ActionResult<List<PaymentRecordDto>>> GetByWorker(int workerProfileId, CancellationToken ct)
    {
        var payments = await paymentService.GetByWorkerAsync(workerProfileId, ct);
        return Ok(payments);
    }

    /// <summary>
    /// Update payment status.
    /// </summary>
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<PaymentRecordDto>> UpdateStatus(
        int id,
        [FromBody] UpdatePaymentStatusRequest request,
        CancellationToken ct)
    {
        var payment = await paymentService.UpdateStatusAsync(id, request.Status, ct);
        return payment is null ? NotFound() : Ok(payment);
    }
}

public record UpdatePaymentStatusRequest(PaymentStatus Status);
