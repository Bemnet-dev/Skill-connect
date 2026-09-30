using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillConnect.Api.DTOs;

namespace SkillConnect.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    /// <summary>
    /// Get the current authenticated user's information.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public ActionResult<CurrentUserResponse> GetCurrentUser()
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var email = User.FindFirst("email")?.Value ?? "";
        var name = User.FindFirst("name")?.Value;
        var phone = User.FindFirst("phoneNumber")?.Value;
        var role = User.FindFirst("role")?.Value ?? "customer";
        var sessionId = User.FindFirst("sessionId")?.Value;

        return Ok(new CurrentUserResponse(
            userId,
            email,
            name,
            phone,
            Enum.Parse<Core.Enums.UserRole>(role, ignoreCase: true),
            sessionId
        ));
    }

    /// <summary>
    /// Health check endpoint.
    /// </summary>
    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult Health()
    {
        return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
    }
}
