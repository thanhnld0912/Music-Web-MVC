using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MusicWebMVC.Data;
using MusicWebMVC.Models;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace MusicWebMVC.Controllers
{
    public class SongController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;
        public SongController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }
        // Hiển thị trang upload
        public IActionResult UploadPage()
        {
            return View();
        }

        public IActionResult SongPage(int postId)
        {
            // Find the post with related data
            var post = _context.Posts
                .Include(p => p.Song)
                    .ThenInclude(s => s.User)
                .Include(p => p.Comments)
                    .ThenInclude(c => c.User)
                .Include(p => p.Likes)
                .FirstOrDefault(p => p.Id == postId);

            if (post == null)
            {
                return NotFound("Không tìm thấy bài hát");
            }

            // Ensure song exists
            var song = post.Song;
            if (song == null)
            {
                return NotFound("Không tìm thấy thông tin bài hát");
            }

            // Get current user ID from session
            int currentUserId = 0;
            int.TryParse(HttpContext.Session.GetString("UserId"), out currentUserId);

            // Calculate follower count
            int followerCount = 0;
            followerCount = _context.Follows
                .Count(f => f.FollowingId == song.ArtistId);

            int likeCount = 0;
            likeCount = post.Likes?.Count ?? 0;

            ViewData["UserLiked"] = post.Likes?.Any(l => l.UserId == currentUserId) ?? false;

            // Check if current user is following this artist
            bool isFollowing = currentUserId > 0 && _context.Follows
                .Any(f => f.FollowerId == currentUserId && f.FollowingId == song.ArtistId);

            ViewBag.IsFollowing = isFollowing;

            // Get user playlists directly from the database
            var userPlaylists = new List<object>();
            if (currentUserId > 0)
            {
                userPlaylists = _context.Playlists
                    .Where(p => p.UserId == currentUserId)
                    .Select(p => new
                    {
                        id = p.Id,
                        name = p.Name,
                        songCount = _context.PlaylistSongs.Count(ps => ps.PlaylistId == p.Id)
                    })
                    .ToList<object>();
            }
            Console.WriteLine($"Found {userPlaylists.Count} playlists for user {currentUserId}");

            // Prepare view data
            ViewData["PostId"] = post.Id;
            ViewData["SongTitle"] = song.Title;
            ViewData["SongId"] = song.Id;
            ViewData["ArtistName"] = post.User.Username;
            ViewData["ArtistId"] = song.ArtistId;
            ViewData["SongFileUrl"] = song.FileUrl;
            ViewData["FollowerCount"] = followerCount;
            ViewData["IsFollowing"] = isFollowing;
            ViewData["LikeCount"] = likeCount;
            ViewData["Comments"] = post.Comments.OrderByDescending(c => c.CreatedAt);
            ViewData["UserPlaylists"] = userPlaylists;

            return View(post);
        }

        [HttpPost]
        public async Task<IActionResult> CreatePlaylist(string playlistName)
        {
            try
            {
                // Check current user
                int userId = 0;
                int.TryParse(HttpContext.Session.GetString("UserId"), out userId);

                if (userId <= 0)
                {
                    return Unauthorized(new { success = false, message = "Bạn cần đăng nhập để thực hiện chức năng này" });
                }

                // Validate playlist name
                if (string.IsNullOrWhiteSpace(playlistName))
                {
                    return BadRequest(new { success = false, message = "Tên playlist không được để trống" });
                }

                // Check if playlist with the same name already exists for this user
                var existingPlaylist = await _context.Playlists
                    .FirstOrDefaultAsync(p => p.UserId == userId && p.Name == playlistName);

                if (existingPlaylist != null)
                {
                    return BadRequest(new { success = false, message = "Bạn đã có playlist với tên này" });
                }

                // Create new playlist
                var playlist = new Playlist
                {
                    Name = playlistName,
                    UserId = userId,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                _context.Playlists.Add(playlist);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Tạo playlist thành công",
                    playlist = new
                    {
                        id = playlist.Id,
                        name = playlist.Name,
                        createdAt = playlist.CreatedAt,
                        songCount = 0
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server: " + ex.Message });
            }
        }

        public async Task<IActionResult> AddComment([FromRoute] int id, [FromBody] CommentInputModel comment)
        {
            if (id <= 0) return BadRequest("Invalid PostId");
            try
            {
                Console.WriteLine($"Received PostId (route): {id}");
                Console.WriteLine($"Received UserId (body): {comment?.UserId}");

                if (comment == null || string.IsNullOrWhiteSpace(comment.Content))
                {
                    return BadRequest(new { message = "Comment content cannot be empty" });
                }

                // Kiểm tra PostId có tồn tại không
                var postExists = await _context.Posts.AnyAsync(p => p.Id == id);
                if (!postExists)
                {
                    return BadRequest(new { message = "Invalid PostId: The post does not exist" });
                }

                var newComment = new Comment
                {
                    PostId = id,
                    UserId = comment.UserId,
                    Content = comment.Content,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Comments.Add(newComment);
                await _context.SaveChangesAsync();

                var user = await _context.Users.FindAsync(comment.UserId);
                string username = user?.Username ?? "Unknown User";

                return Ok(new
                {
                    id = newComment.Id,
                    content = newComment.Content,
                    userId = newComment.UserId,
                    userName = username,
                    createdAt = newComment.CreatedAt
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.InnerException?.Message ?? ex.Message}");
                return StatusCode(500, new { message = "An error occurred", error = ex.InnerException?.Message ?? ex.Message });
            }
        }
    
        public async Task<IActionResult> Upload(
            IFormFile file,
            string title,
            int artistId,
            string content,
            string genre,
            string era,
            string type,
            string description)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { success = false, message = "Vui lòng chọn một tệp để tải lên." });
                }

                var allowedExtensions = new[] { ".mp3", ".m4a" };
                var fileExtension = Path.GetExtension(file.FileName).ToLower();
                if (!allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest(new { success = false, message = "Chỉ hỗ trợ các tệp MP3 hoặc M4A." });
                }

                if (string.IsNullOrEmpty(title) || artistId <= 0)
                {
                    return BadRequest(new { success = false, message = "Thiếu tiêu đề hoặc ID nghệ sĩ không hợp lệ." });
                }

                var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var uniqueFileName = $"{Path.GetFileNameWithoutExtension(file.FileName)}_{Guid.NewGuid():N}{fileExtension}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var postContent = !string.IsNullOrEmpty(description)
                    ? description
                    : !string.IsNullOrEmpty(content)
                        ? content
                        : $"Bài hát mới: {title}";

                var post = new Post
                {
                    UserId = artistId,
                    Content = postContent,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };
                _context.Set<Post>().Add(post);
                await _context.SaveChangesAsync();

                var song = new Song
                {
                    Title = title,
                    ArtistId = artistId,
                    PostId = post.Id,
                    FileUrl = "/uploads/" + uniqueFileName,
                    Genre = genre,
                    Era = era,
                    Type = type,
                    UploadDate = DateTime.Now,
                    Status = "Public"
                };
                _context.Set<Song>().Add(song);
                await _context.SaveChangesAsync();

                // ✅ Đếm số bài và nâng cấp nếu đủ
                var totalSongs = await _context.Set<Song>()
                    .CountAsync(s => s.ArtistId == artistId);

                var user = await _context.Set<User>().FindAsync(artistId);
                if (user != null && user.level == "Bronze" && totalSongs >= 2)
                {
                    user.level = "Silver";
                    await _context.SaveChangesAsync();
                }

                else if (user != null && user.level == "Silver" && totalSongs >= 4)
                {
                    user.level = "Gold";
                    await _context.SaveChangesAsync();
                }

                else if (user != null && user.level == "Gold" && totalSongs >= 10)
                {
                    user.level = "Diamond";
                    await _context.SaveChangesAsync();
                }

                return Ok(new
                {
                    success = true,
                    message = "Tải lên thành công!",
                    fileUrl = song.FileUrl,
                    postId = post.Id,
                    songId = song.Id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server: " + ex.Message });
            }
        }

    }
}
