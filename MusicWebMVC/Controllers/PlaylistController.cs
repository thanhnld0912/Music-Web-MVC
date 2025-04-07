using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MusicWebMVC.Data;
using MusicWebMVC.Models;

namespace MusicWebMVC.Controllers
{
    public class PlaylistController : Controller
    {
        private readonly ApplicationDbContext _context;
        public PlaylistController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> PlaylistPage(int id)
        {
            // Retrieve the playlist with all related data
            var playlist = await _context.Playlists
                .Include(p => p.User)
                .Include(p => p.PlaylistSongs)
                    .ThenInclude(ps => ps.Song)
                        .ThenInclude(s => s.User)
                .Include(p => p.PlaylistSongs)
                    .ThenInclude(ps => ps.Song)
                        .ThenInclude(s => s.Post)  // Add this line
                .FirstOrDefaultAsync(p => p.Id == id);

            if (playlist == null)
            {
                return NotFound();
            }

            // Extract all unique artists from the songs in this playlist
            var artistsInPlaylist = playlist.PlaylistSongs
                .Where(ps => ps.Song != null && ps.Song.User != null)
                .Select(ps => ps.Song.User.Username)
                .Distinct()
                .ToList();

            ViewBag.PlaylistArtists = artistsInPlaylist;
            return View(playlist);
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
        [HttpGet]
        public async Task<IActionResult> GetUserPlaylists()
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

                // Get all playlists for this user with song count
                var playlists = await _context.Playlists
                    .Where(p => p.UserId == userId)
                    .Select(p => new
                    {
                        id = p.Id,
                        name = p.Name,
                        createdAt = p.CreatedAt,
                        updatedAt = p.UpdatedAt,
                        songCount = p.PlaylistSongs.Count
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    playlists = playlists
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server: " + ex.Message });
            }
        }
        [HttpPost]
        public async Task<IActionResult> DeletePlaylist(int playlistId)
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

                // Check if playlist exists and belongs to current user
                var playlist = await _context.Playlists.FindAsync(playlistId);
                if (playlist == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy playlist" });
                }

                if (playlist.UserId != userId)
                {
                    return Unauthorized(new { success = false, message = "Bạn không có quyền xóa playlist này" });
                }

                // Delete all playlist-song relationships first
                var playlistSongs = await _context.PlaylistSongs
                    .Where(ps => ps.PlaylistId == playlistId)
                    .ToListAsync();

                _context.PlaylistSongs.RemoveRange(playlistSongs);

                // Delete the playlist
                _context.Playlists.Remove(playlist);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Đã xóa playlist thành công"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server: " + ex.Message });
            }
        }


        [HttpPost]
        public async Task<IActionResult> AddSong(int playlistId, int songId)
        {
            try
            {
                // Kiểm tra người dùng hiện tại
                int userId = 0;
                int.TryParse(HttpContext.Session.GetString("UserId"), out userId);

                if (userId <= 0)
                {
                    return Unauthorized(new { success = false, message = "Bạn cần đăng nhập để thực hiện chức năng này" });
                }


                // Kiểm tra playlist có tồn tại và thuộc về người dùng hiện tại
                var playlist = await _context.Playlists.FindAsync(playlistId);
                if (playlist == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy playlist" });
                }

                if (playlist.UserId != userId)
                {
                    return Unauthorized(new { success = false, message = "Bạn không có quyền chỉnh sửa playlist này" });
                }

                // Kiểm tra bài hát có tồn tại
                var song = await _context.Songs.FindAsync(songId);
                if (song == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy bài hát" });
                }

                // Kiểm tra bài hát đã có trong playlist chưa
                var existingEntry = await _context.PlaylistSongs
                    .FirstOrDefaultAsync(ps => ps.PlaylistId == playlistId && ps.SongId == songId);

                if (existingEntry != null)
                {
                    return BadRequest(new { success = false, message = "Bài hát đã có trong playlist" });
                }

                // Thêm bài hát vào playlist
                var playlistSong = new PlaylistSong
                {
                    PlaylistId = playlistId,
                    SongId = songId
                };

                // Cập nhật thời gian cập nhật playlist
                playlist.UpdatedAt = DateTime.Now;
                _context.Entry(playlist).State = EntityState.Modified;

                _context.PlaylistSongs.Add(playlistSong);
                await _context.SaveChangesAsync();

                // Lấy thông tin bài hát để trả về
                var songInfo = await _context.Songs
                    .Include(s => s.User)
                    .FirstOrDefaultAsync(s => s.Id == songId);

                return Ok(new
                {
                    success = true,
                    message = "Đã thêm bài hát vào playlist",
                    song = new
                    {
                        id = songInfo.Id,
                        title = songInfo.Title,
                        artist = songInfo.User.Username,
                        fileUrl = songInfo.FileUrl
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server: " + ex.Message });
            }
        }

        // Xóa bài hát khỏi playlist (Ajax)
        [HttpPost]
        public async Task<IActionResult> RemoveSong(int playlistId, int songId)
        {
            try
            {
                // Kiểm tra người dùng hiện tại
                int userId = 0;
                int.TryParse(HttpContext.Session.GetString("UserId"), out userId);

                if (userId <= 0)
                {
                    return Unauthorized(new { success = false, message = "Bạn cần đăng nhập để thực hiện chức năng này" });
                }

                // Kiểm tra playlist có tồn tại và thuộc về người dùng hiện tại
                var playlist = await _context.Playlists.FindAsync(playlistId);
                if (playlist == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy playlist" });
                }

                if (playlist.UserId != userId)
                {
                    return Unauthorized(new { success = false, message = "Bạn không có quyền chỉnh sửa playlist này" });
                }

                // Tìm bản ghi playlist-song
                var playlistSong = await _context.PlaylistSongs
                    .FirstOrDefaultAsync(ps => ps.PlaylistId == playlistId && ps.SongId == songId);

                if (playlistSong == null)
                {
                    return NotFound(new { success = false, message = "Bài hát không có trong playlist" });
                }

                // Cập nhật thời gian cập nhật playlist
                playlist.UpdatedAt = DateTime.Now;
                _context.Entry(playlist).State = EntityState.Modified;

                // Xóa bản ghi
                _context.PlaylistSongs.Remove(playlistSong);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Đã xóa bài hát khỏi playlist"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server: " + ex.Message });
            }
        }
        [HttpPost]
        public async Task<IActionResult> UpdatePlaylistName(int playlistId, string newName)
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
                if (string.IsNullOrWhiteSpace(newName))
                {
                    return BadRequest(new { success = false, message = "Tên playlist không được để trống" });
                }

                // Check if playlist exists and belongs to current user
                var playlist = await _context.Playlists.FindAsync(playlistId);
                if (playlist == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy playlist" });
                }

                if (playlist.UserId != userId)
                {
                    return Unauthorized(new { success = false, message = "Bạn không có quyền chỉnh sửa playlist này" });
                }

                // Check if playlist with the same name already exists for this user
                var existingPlaylist = await _context.Playlists
                    .FirstOrDefaultAsync(p => p.UserId == userId && p.Name == newName && p.Id != playlistId);

                if (existingPlaylist != null)
                {
                    return BadRequest(new { success = false, message = "Bạn đã có playlist với tên này" });
                }

                // Update playlist name
                playlist.Name = newName;
                playlist.UpdatedAt = DateTime.Now;
                _context.Entry(playlist).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Cập nhật tên playlist thành công",
                    playlist = new
                    {
                        id = playlist.Id,
                        name = playlist.Name,
                        updatedAt = playlist.UpdatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server: " + ex.Message });
            }
        }
    }
}
