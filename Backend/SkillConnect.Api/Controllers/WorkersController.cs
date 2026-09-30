using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillConnect.Api.DTOs;
using SkillConnect.Api.Services;

namespace SkillConnect.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkersController(IWorkerService workerService) : ControllerBase
{
    /// <summary>
    /// Search and discover workers with filters.
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<PagedResponse<WorkerSummaryResponse>>> Search(
        [FromQuery] WorkerSearchRequest request,
        CancellationToken ct)
    {
        var results = await workerService.SearchAsync(request, ct);
        return Ok(results);
    }

    /// <summary>
    /// Get detailed worker profile by ID.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<WorkerDetailResponse>> GetById(int id, CancellationToken ct)
    {
        var worker = await workerService.GetByIdAsync(id, ct);
        return worker is null ? NotFound() : Ok(worker);
    }

    /// <summary>
    /// Get the current authenticated user's worker profile.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<WorkerDetailResponse>> GetMyProfile(CancellationToken ct)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var worker = await workerService.GetByUserIdAsync(userId, ct);
        return worker is null ? NotFound() : Ok(worker);
    }
}
