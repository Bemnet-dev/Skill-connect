using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillConnect.Api.DTOs;
using SkillConnect.Api.Services;
using SkillConnect.Core.Enums;

namespace SkillConnect.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QuotesController(IQuoteService quoteService, IWorkerService workerService) : ControllerBase
{
    /// <summary>
    /// Submit a quote for a job request.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<QuoteResponse>> Create(
        [FromBody] CreateQuoteRequest request,
        CancellationToken ct)
    {
        var workerProfileId = await GetWorkerProfileId();
        if (workerProfileId is null)
            return Forbid();

        var quote = await quoteService.CreateAsync(workerProfileId.Value, request, ct);
        return CreatedAtAction(nameof(GetById), new { id = quote.Id }, quote);
    }

    /// <summary>
    /// Get a quote by ID.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<QuoteResponse>> GetById(int id, CancellationToken ct)
    {
        var quote = await quoteService.GetByIdAsync(id, ct);
        return quote is null ? NotFound() : Ok(quote);
    }

    /// <summary>
    /// Get all quotes submitted by the current worker.
    /// </summary>
    [HttpGet("my")]
    public async Task<ActionResult<List<QuoteResponse>>> GetMy(CancellationToken ct)
    {
        var workerProfileId = await GetWorkerProfileId();
        if (workerProfileId is null)
            return Forbid();

        var quotes = await quoteService.GetByWorkerAsync(workerProfileId.Value, ct);
        return Ok(quotes);
    }

    /// <summary>
    /// Get all quotes for a specific job request.
    /// </summary>
    [HttpGet("job-request/{jobRequestId:int}")]
    public async Task<ActionResult<List<QuoteResponse>>> GetByJobRequest(int jobRequestId, CancellationToken ct)
    {
        var quotes = await quoteService.GetByJobRequestAsync(jobRequestId, ct);
        return Ok(quotes);
    }

    /// <summary>
    /// Update quote status (accept/reject/counter).
    /// </summary>
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<QuoteResponse>> UpdateStatus(
        int id,
        [FromBody] UpdateQuoteStatusRequest request,
        CancellationToken ct)
    {
        var quote = await quoteService.UpdateStatusAsync(id, request.Status, ct);
        return quote is null ? NotFound() : Ok(quote);
    }

    private async Task<int?> GetWorkerProfileId()
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return null;

        var worker = await workerService.GetByUserIdAsync(userId);
        return worker?.Id;
    }
}

public record UpdateQuoteStatusRequest(QuoteStatus Status);
