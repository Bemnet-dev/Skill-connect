namespace SkillConnect.Core.Entities;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? IconUrl { get; set; }

    // Navigation
    public ICollection<JobRequest> JobRequests { get; set; } = [];
}
