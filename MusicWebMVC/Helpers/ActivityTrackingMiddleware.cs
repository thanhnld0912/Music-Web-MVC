using Microsoft.EntityFrameworkCore;
using MusicWebMVC.Data;

public class ActivityTrackingMiddleware
{
    private readonly RequestDelegate _next;

    public ActivityTrackingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context, ApplicationDbContext dbContext)
    {
        var userId = context.Session.GetString("UserId");

        if (!string.IsNullOrEmpty(userId))
        {
            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id.ToString() == userId);
            if (user != null)
            {
                user.LastActivity = DateTime.UtcNow;
                user.IsActive = true;
                await dbContext.SaveChangesAsync();
            }
        }

        await _next(context);
    }
}
