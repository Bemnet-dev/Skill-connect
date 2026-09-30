using Microsoft.EntityFrameworkCore;
using SkillConnect.Api.DTOs;
using SkillConnect.Infrastructure.Persistence;

namespace SkillConnect.Api.Services;

public interface ICategoryService
{
    Task<List<CategoryResponse>> GetAllAsync(CancellationToken ct = default);
}

public class CategoryService(AppDbContext db) : ICategoryService
{
    public async Task<List<CategoryResponse>> GetAllAsync(CancellationToken ct = default)
    {
        return await db.Categories
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new CategoryResponse(c.Id, c.Name, c.Slug, c.IconUrl))
            .ToListAsync(ct);
    }
}
