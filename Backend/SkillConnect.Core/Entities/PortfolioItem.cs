namespace SkillConnect.Core.Entities;

public class PortfolioItem
{
    public int Id { get; set; }
    public int WorkerProfileId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? Caption { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public WorkerProfile WorkerProfile { get; set; } = null!;
}
