using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillConnect.Api.DTOs;
using SkillConnect.Api.Services;

namespace SkillConnect.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReviewsController(IReviewService reviewService) : ControllerBase
{
    /// <summary>
    /// Submit a review for a completed booking.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ReviewDto>> Create(
        [FromBody] CreateReviewRequest request,
        CancellationToken ct)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        try
        {
            var review = await reviewService.CreateAsync(userId, request, ct);
            return CreatedAtAction(nameof(GetByBooking), new { bookingId = request.BookingId }, review);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get all reviews for a specific worker.
    /// </summary>
    [HttpGet("worker/{workerProfileId:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<List<ReviewDto>>> GetByWorker(int workerProfileId, CancellationToken ct)
    {
        var reviews = await reviewService.GetByWorkerAsync(workerProfileId, ct);
        return Ok(reviews);
    }

    /// <summary>
    /// Get all reviews for a specific booking.
    /// </summary>
    [HttpGet("booking/{bookingId:int}")]
    public async Task<ActionResult<List<ReviewDto>>> GetByBooking(int bookingId, CancellationToken ct)
    {
        var reviews = await reviewService.GetByBookingAsync(bookingId, ct);
        return Ok(reviews);
    }
}
