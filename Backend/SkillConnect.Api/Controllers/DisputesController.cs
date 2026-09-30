using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillConnect.Api.DTOs;
using SkillConnect.Api.Services;

namespace SkillConnect.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DisputesController(IDisputeService disputeService) : ControllerBase
{
    /// <summary>
    /// Raise a dispute for a booking.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<DisputeResponse>> Create(
        [FromBody] CreateDisputeRequest request,
        CancellationToken ct)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        try
        {
            var dispute = await disputeService.CreateAsync(userId, request, ct);
            return CreatedAtAction(nameof(GetById), new { id = dispute.Id }, dispute);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get a dispute by ID.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<DisputeResponse>> GetById(int id, CancellationToken ct)
    {
        var dispute = await disputeService.GetByIdAsync(id, ct);
        return dispute is null ? NotFound() : Ok(dispute);
    }

    /// <summary>
    /// Get all disputes raised by the current user.
    /// </summary>
    [HttpGet("my")]
    public async Task<ActionResult<List<DisputeResponse>>> GetMy(CancellationToken ct)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var disputes = await disputeService.GetByUserAsync(userId, ct);
        return Ok(disputes);
    }

    /// <summary>
    /// Get all open disputes (admin only).
    /// </summary>
    [HttpGet("open")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<DisputeResponse>>> GetOpen(CancellationToken ct)
    {
        var disputes = await disputeService.GetOpenAsync(ct);
        return Ok(disputes);
    }

    /// <summary>
    /// Resolve a dispute (admin only).
    /// </summary>
    [HttpPatch("{id:int}/resolve")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<DisputeResponse>> Resolve(
        int id,
        [FromBody] ResolveDisputeRequest request,
        CancellationToken ct)
    {
        var dispute = await disputeService.ResolveAsync(id, request, ct);
        return dispute is null ? NotFound() : Ok(dispute);
    }
}
