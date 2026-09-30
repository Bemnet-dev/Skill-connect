using Microsoft.AspNetCore.Mvc;
using SkillConnect.Api.DTOs;
using SkillConnect.Api.Services;

namespace SkillConnect.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController(ICategoryService categoryService) : ControllerBase
{
    /// <summary>
    /// Get all service categories.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<CategoryResponse>>> GetAll(CancellationToken ct)
    {
        var categories = await categoryService.GetAllAsync(ct);
        return Ok(categories);
    }
}
