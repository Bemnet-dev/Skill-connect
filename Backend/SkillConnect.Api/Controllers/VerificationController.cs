using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillConnect.Api.DTOs;
using SkillConnect.Api.Services;
using SkillConnect.Core.Enums;

namespace SkillConnect.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VerificationController(IVerificationService verificationService) : ControllerBase
{
    /// <summary>
    /// Submit a verification document.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<VerificationSubmissionResponse>> Submit(
        [FromBody] CreateVerificationRequest request,
        CancellationToken ct)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        // Get worker profile ID for this user
        // In production, this would be cached or looked up efficiently
        var workerProfileId = 1; // Placeholder — implement proper lookup

        var submission = await verificationService.SubmitAsync(workerProfileId, request, ct);
        return CreatedAtAction(nameof(GetByWorker), new { workerProfileId }, submission);
    }

    /// <summary>
    /// Get verification submissions for a worker.
    /// </summary>
    [HttpGet("worker/{workerProfileId:int}")]
    public async Task<ActionResult<List<VerificationSubmissionResponse>>> GetByWorker(
        int workerProfileId,
        CancellationToken ct)
    {
        var submissions = await verificationService.GetByWorkerAsync(workerProfileId, ct);
        return Ok(submissions);
    }

    /// <summary>
    /// Get all pending verification submissions (admin only).
    /// </summary>
    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<VerificationSubmissionResponse>>> GetPending(CancellationToken ct)
    {
        var submissions = await verificationService.GetPendingAsync(ct);
        return Ok(submissions);
    }

    /// <summary>
    /// Review a verification submission (admin only).
    /// </summary>
    [HttpPatch("{id:int}/review")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<VerificationSubmissionResponse>> Review(
        int id,
        [FromBody] ReviewVerificationRequest request,
        CancellationToken ct)
    {
        var adminId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(adminId))
            return Unauthorized();

        var submission = await verificationService.ReviewAsync(id, adminId, request, ct);
        return submission is null ? NotFound() : Ok(submission);
    }
}
