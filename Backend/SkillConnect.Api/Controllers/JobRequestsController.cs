using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillConnect.Api.DTOs;
using SkillConnect.Api.Services;
using SkillConnect.Core.Enums;

namespace SkillConnect.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class JobRequestsController(IJobRequestService jobRequestService) : ControllerBase
{
    /// <summary>
    /// Create a new job request.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<JobRequestResponse>> Create(
        [FromBody] CreateJobRequestRequest request,
        CancellationToken ct)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var jobRequest = await jobRequestService.CreateAsync(userId, request, ct);
        return CreatedAtAction(nameof(GetById), new { id = jobRequest.Id }, jobRequest);
    }

    /// <summary>
    /// Get a job request by ID.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<JobRequestResponse>> GetById(int id, CancellationToken ct)
    {
        var jobRequest = await jobRequestService.GetByIdAsync(id, ct);
        return jobRequest is null ? NotFound() : Ok(jobRequest);
    }

    /// <summary>
    /// Get all job requests for the current user.
    /// </summary>
    [HttpGet("my")]
    public async Task<ActionResult<List<JobRequestResponse>>> GetMy(CancellationToken ct)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var jobRequests = await jobRequestService.GetByCustomerAsync(userId, ct);
        return Ok(jobRequests);
    }

    /// <summary>
    /// Get all open job requests (for workers).
    /// </summary>
    [HttpGet("open")]
    public async Task<ActionResult<List<JobRequestResponse>>> GetOpen(CancellationToken ct)
    {
        var jobRequests = await jobRequestService.GetOpenAsync(ct);
        return Ok(jobRequests);
    }

    /// <summary>
    /// Update job request status.
    /// </summary>
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<JobRequestResponse>> UpdateStatus(
        int id,
        [FromBody] UpdateStatusRequest request,
        CancellationToken ct)
    {
        var jobRequest = await jobRequestService.UpdateStatusAsync(id, request.Status, ct);
        return jobRequest is null ? NotFound() : Ok(jobRequest);
    }
}

public record UpdateStatusRequest(JobRequestStatus Status);
