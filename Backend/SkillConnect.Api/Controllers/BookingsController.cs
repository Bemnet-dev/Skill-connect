using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillConnect.Api.DTOs;
using SkillConnect.Api.Services;
using SkillConnect.Core.Enums;

namespace SkillConnect.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BookingsController(IBookingService bookingService) : ControllerBase
{
    /// <summary>
    /// Create a booking from an accepted quote.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<BookingResponse>> Create(
        [FromBody] CreateBookingRequest request,
        CancellationToken ct)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        try
        {
            var booking = await bookingService.CreateAsync(userId, request, ct);
            return CreatedAtAction(nameof(GetById), new { id = booking.Id }, booking);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get a booking by ID.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<BookingResponse>> GetById(int id, CancellationToken ct)
    {
        var booking = await bookingService.GetByIdAsync(id, ct);
        return booking is null ? NotFound() : Ok(booking);
    }

    /// <summary>
    /// Get all bookings for the current customer.
    /// </summary>
    [HttpGet("my")]
    public async Task<ActionResult<List<BookingResponse>>> GetMy(CancellationToken ct)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var bookings = await bookingService.GetByCustomerAsync(userId, ct);
        return Ok(bookings);
    }

    /// <summary>
    /// Get all bookings for the current worker.
    /// </summary>
    [HttpGet("worker/{workerProfileId:int}")]
    public async Task<ActionResult<List<BookingResponse>>> GetByWorker(int workerProfileId, CancellationToken ct)
    {
        var bookings = await bookingService.GetByWorkerAsync(workerProfileId, ct);
        return Ok(bookings);
    }

    /// <summary>
    /// Update booking status (check-in, check-out, complete, cancel).
    /// </summary>
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<BookingResponse>> UpdateStatus(
        int id,
        [FromBody] UpdateBookingStatusRequest request,
        CancellationToken ct)
    {
        var booking = await bookingService.UpdateStatusAsync(id, request.Status, ct);
        return booking is null ? NotFound() : Ok(booking);
    }
}
