using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MusicWebMVC.Data;
using MusicWebMVC.Models;
using System.Linq;
using System.Threading.Tasks;

namespace MusicWebMVC.Controllers
{
    public class HomeController : Controller
    {
        private readonly ApplicationDbContext _context;

        public HomeController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> NewFeed(string filter = "trending")
        {
            // Get the current user ID
            int currentUserId = 0;
            int.TryParse(HttpContext.Session.GetString("UserId"), out currentUserId);
            ViewData["IsHome"] = true;
            ViewData["CurrentFilter"] = filter; // Store current filter for UI active state

            // Base query
            var postsQuery = _context.Posts
                .Include(p => p.User)
                .Include(p => p.Song)
                .Include(p => p.Likes)
                .Include(p => p.Dislikes)
                .Include(p => p.Comments);

            // Apply filter
            if (filter?.ToLower() == "following" && currentUserId > 0)
            {
                // Get IDs of users that the current user follows
                var followingIds = await _context.Follows
                    .Where(f => f.FollowerId == currentUserId)
                    .Select(f => f.FollowingId)
                    .ToListAsync();

                // Filter posts by these users
                postsQuery = postsQuery = postsQuery
            .Where(p => followingIds.Contains(p.UserId)).Include(p => p.User)
                .Include(p => p.Song)
                .Include(p => p.Likes)
                .Include(p => p.Dislikes)
            .Include(p => p.Comments);
            }

            // Get the final posts list
            var posts = await postsQuery
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            // Check likes/dislikes for the current user
            if (currentUserId > 0)
            {
                foreach (var post in posts)
                {
                    ViewData[$"UserLiked_{post.Id}"] = post.Likes?.Any(l => l.UserId == currentUserId) ?? false;
                    ViewData[$"UserDisliked_{post.Id}"] = post.Dislikes?.Any(d => d.UserId == currentUserId) ?? false;
                }
            }

            // Get all playlists for the current user
            if (currentUserId > 0)
            {
                var userPlaylists = await _context.Playlists
                    .Where(p => p.UserId == currentUserId)
                    .Include(p => p.PlaylistSongs)
                        .ThenInclude(ps => ps.Song)
                            .ThenInclude(s => s.User)
                    .ToListAsync();

                ViewBag.UserPlaylists = userPlaylists;
            }
            else
            {
                ViewBag.UserPlaylists = new List<Playlist>();
            }

            return View(posts);
        }
        public async Task<IActionResult> NewFeedAdmin()
        {
            var posts = await _context.Posts
                .Include(p => p.User)
                .Include(p => p.Song)
                .Include(p => p.Likes)
                .Include(p => p.Dislikes)
                .Include(p => p.Comments)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return View(posts);  // Truyền dữ liệu posts vào View
        }


        public IActionResult Index()
        {
            return View();
        }

        public async Task<IActionResult> SearchPage(string searchTerm, string[] genre = null, string[] era = null, string[] type = null, string sortBy = "Most Popular")
        {
            // Start with all songs
            var songsQuery = _context.Songs
                .Include(s => s.User)
                .Include(s => s.Likes)
                .AsQueryable();

            // Apply search term filter if provided
            if (!string.IsNullOrEmpty(searchTerm))
            {
                songsQuery = songsQuery.Where(s =>
                    s.Title.Contains(searchTerm) ||
                    s.User.Username.Contains(searchTerm) ||
                    (s.Lyrics != null && s.Lyrics.Contains(searchTerm)));
            }

            // Apply genre filter (now supports multiple selections)
            if (genre != null && genre.Length > 0 && !genre.Contains("All"))
            {
                songsQuery = songsQuery.Where(s => genre.Contains(s.Genre));
            }

            // Apply era filter (now supports multiple selections)
            if (era != null && era.Length > 0 && !era.Contains("All"))
            {
                songsQuery = songsQuery.Where(s => era.Contains(s.Era));
            }

            // Apply type filter (now supports multiple selections)
            if (type != null && type.Length > 0 && !type.Contains("All"))
            {
                songsQuery = songsQuery.Where(s => type.Contains(s.Type));
            }

            // Only include songs with "Approved" status
            songsQuery = songsQuery.Where(s => s.Status == "Public");

            // Apply sorting
            switch (sortBy)
            {
                case "Newest":
                    songsQuery = songsQuery.OrderByDescending(s => s.UploadDate);
                    break;
                case "Oldest":
                    songsQuery = songsQuery.OrderBy(s => s.UploadDate);
                    break;
                case "A-Z":
                    songsQuery = songsQuery.OrderBy(s => s.Title);
                    break;
                case "Most Popular":
                default:
                    songsQuery = songsQuery.OrderByDescending(s => s.Likes.Count);
                    break;
            }

            var songs = await songsQuery.ToListAsync();
            var currentUserId = 0;
            int.TryParse(HttpContext.Session.GetString("UserId"), out currentUserId);

            if (currentUserId > 0)
            {
                var userPlaylists = await _context.Playlists
                    .Where(p => p.UserId == currentUserId)
                    .Include(p => p.PlaylistSongs)
                        .ThenInclude(ps => ps.Song)
                            .ThenInclude(s => s.User)
                    .ToListAsync();

                ViewBag.UserPlaylists = userPlaylists;
            }
            else
            {
                ViewBag.UserPlaylists = new List<Playlist>();
            }
            // Pass data to view
            ViewBag.SearchTerm = searchTerm;
            ViewBag.SelectedGenres = genre ?? new string[] { "All" };
            ViewBag.SelectedEras = era ?? new string[] { "All" };
            ViewBag.SelectedTypes = type ?? new string[] { "All" };
            ViewBag.SelectedSort = sortBy;
            ViewBag.ResultCount = songs.Count;

            return View(songs);
        }
        public IActionResult Loader()
        {
            return View();
        }

        public async Task<IActionResult> ProfileUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            // Get user's posts with all related data
            var userPosts = await _context.Posts
                .Include(p => p.User)
                .Include(p => p.Song)
                .Include(p => p.Likes)
                .Include(p => p.Dislikes)
                .Include(p => p.Comments)
                .Where(p => p.UserId == id)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            // Get user's songs that aren't attached to posts
            var userSongs = await _context.Songs
                .Where(s => s.ArtistId == id)
                .OrderByDescending(s => s.UploadDate)
                .ToListAsync();

            // Count followers and following
            var followerCount = await _context.Follows
                .CountAsync(f => f.FollowingId == id);
            var followingCount = await _context.Follows
                .CountAsync(f => f.FollowerId == id);

            ViewBag.FollowerCount = followerCount;
            ViewBag.FollowingCount = followingCount;

            // Get current user ID from session
            var currentUserId = HttpContext.Session.GetString("UserId");

            // Check if current user is viewing their own profile
            bool isOwnProfile = false;
            if (!string.IsNullOrEmpty(currentUserId) && int.Parse(currentUserId) == id)
            {
                isOwnProfile = true;
            }

            // Check if current user is following this profile
            if (!string.IsNullOrEmpty(currentUserId))
            {
                var isFollowing = await _context.Follows
                    .AnyAsync(f => f.FollowerId == int.Parse(currentUserId) && f.FollowingId == id);
                ViewBag.IsFollowing = isFollowing;

                // For each post, check if the current user has liked or disliked it
                foreach (var post in userPosts)
                {
                    ViewData[$"UserLiked_{post.Id}"] = post.Likes?.Any(l => l.UserId == int.Parse(currentUserId)) ?? false;
                    ViewData[$"UserDisliked_{post.Id}"] = post.Dislikes?.Any(d => d.UserId == int.Parse(currentUserId)) ?? false;
                }
            }

            // Pass the user's posts and songs to the view
            ViewBag.UserPosts = userPosts;
            ViewBag.UserSongs = userSongs;
            ViewBag.IsOwnProfile = isOwnProfile;

            return View(user);
        }
        public async Task<IActionResult> SearchArtists(string searchTerm)
        {
            if (string.IsNullOrEmpty(searchTerm))
            {
                return Json(new List<object>());
            }

            var artists = await _context.Users
                .Where(u => u.Username.Contains(searchTerm))
                .Select(u => new
                {
                    id = u.Id,
                    username = u.Username,
                    //avatarUrl = u.AvatarUrl
                })
                .Take(15)
                .ToListAsync();

            return Json(artists);
        }
    }

}