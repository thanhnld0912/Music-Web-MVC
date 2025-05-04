using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using MusicWebMVC.Data;  // Đảm bảo đúng namespace của ApplicationDbContext
using MusicWebMVC.Models; // Nếu có Model Playlist, Post

namespace MusicWebMVC.Components
{
    public class SidebarViewComponent : ViewComponent
    {
        private readonly ApplicationDbContext _context;

        public SidebarViewComponent(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IViewComponentResult>
    InvokeAsync()
        {
            int currentUserId = 0;
            int.TryParse(HttpContext.Session.GetString("UserId"), out currentUserId);

            var posts = await _context.Posts
            .Include(p => p.User)
            .Include(p => p.Song)
            .Include(p => p.Likes)
            .Include(p => p.Dislikes)
            .Include(p => p.Comments)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

            if (currentUserId > 0)
            {
                foreach (var post in posts)
                {
                    ViewData[$"UserLiked_{post.Id}"] = post.Likes?.Any(l => l.UserId == currentUserId) ?? false;
                    ViewData[$"UserDisliked_{post.Id}"] = post.Dislikes?.Any(d => d.UserId == currentUserId) ?? false;
                }

                var userPlaylists = await _context.Playlists
                .Where(p => p.UserId == currentUserId)
                .Include(p => p.PlaylistSongs)
                .ThenInclude(ps => ps.Song)
                .ToListAsync();

                ViewBag.UserPlaylists = userPlaylists;
            }
            else
            {
                ViewBag.UserPlaylists = new List<Playlist>
                    ();
            }

            return View(posts);
        }
    }
}
