using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Services;
using Google.Apis.Upload;
using Google.Apis.YouTube.v3;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MusicWebMVC.Data;
using MusicWebMVC.Models;
using Xabe.FFmpeg;
// Add explicit aliases to resolve ambiguity
using YouTubeVideo = Google.Apis.YouTube.v3.Data.Video;
using YouTubeVideoSnippet = Google.Apis.YouTube.v3.Data.VideoSnippet;
using YouTubeVideoStatus = Google.Apis.YouTube.v3.Data.VideoStatus;
// Use these aliases if you need to work with YouTube Playlist or Comment types
using YouTubePlaylist = Google.Apis.YouTube.v3.Data.Playlist;
using YouTubeComment = Google.Apis.YouTube.v3.Data.Comment;
using System.Net.Http.Headers;
using Newtonsoft.Json.Linq;

namespace MusicWebMVC.Controllers
{
    public class SongController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<SongController> _logger;
        private readonly string _tempUploadPath;
        private readonly string _convertedFolder;
        private readonly string _uploadsFolder;

        public SongController(ApplicationDbContext context, IWebHostEnvironment env, ILogger<SongController> logger)
        {
            _context = context;
            _env = env;
            _logger = logger;

            // Initialize common paths
            _tempUploadPath = Path.Combine(_env.ContentRootPath, "TempUploads", "Input");
            _convertedFolder = Path.Combine(_env.WebRootPath, "converted");
            _uploadsFolder = Path.Combine(_env.WebRootPath, "uploads");

            // Ensure directories exist
            Directory.CreateDirectory(_tempUploadPath);
            Directory.CreateDirectory(_convertedFolder);
            Directory.CreateDirectory(_uploadsFolder);
        }

        // Existing methods remain unchanged...
        public IActionResult UploadPage()
        {
            return View();
        }

        public IActionResult UploadPageAdmin()
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
            int followerCount = _context.Follows
                .Count(f => f.FollowingId == song.ArtistId);

            int likeCount = post.Likes?.Count ?? 0;

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

            var avatarUrl = post.User.AvatarUrl;
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
            ViewData["avatarUrl"] = avatarUrl;

            return View(post);
        }

        [HttpPost]
        public async Task<IActionResult> CreatePlaylist(string playlistName)
        {
            try
            {
                // Check current user
                if (!int.TryParse(HttpContext.Session.GetString("UserId"), out int userId) || userId <= 0)
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
                _logger.LogError(ex, "Error creating playlist");
                return StatusCode(500, new { success = false, message = "Lỗi server: " + ex.Message });
            }
        }

        [HttpPost]
        [Route("Song/AddComment/{id}")]
        public async Task<IActionResult> AddComment([FromRoute] int id, [FromBody] CommentInputModel comment)
        {
            if (id <= 0)
                return BadRequest(new { message = "Invalid PostId" });

            try
            {
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
                _logger.LogError(ex, "Error adding comment to post {PostId}", id);
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        [HttpPost]
        [Route("api/convert-to-mp4")]
        public async Task<IActionResult> ConvertToMP4(IFormFile audioFile)
        {
            try
            {
                if (audioFile == null || audioFile.Length == 0)
                {
                    return BadRequest(new { success = false, message = "Không có tệp âm thanh được cung cấp" });
                }

                // Validate file format
                var allowedExtensions = new[] { ".mp3", ".m4a", ".wav", ".aac" };
                var fileExtension = Path.GetExtension(audioFile.FileName).ToLower();
                if (!allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest(new { success = false, message = "Chỉ hỗ trợ các tệp MP3, M4A, WAV hoặc AAC." });
                }

                // Create unique filenames
                var uniqueInputName = $"{Guid.NewGuid().ToString("N")}{fileExtension}";
                var inputFilePath = Path.Combine(_tempUploadPath, uniqueInputName);

                _logger.LogInformation($"Đang lưu tệp âm thanh tải lên tại: {inputFilePath}");
                using (var stream = new FileStream(inputFilePath, FileMode.Create))
                {
                    await audioFile.CopyToAsync(stream);
                }

                var uniqueOutputName = $"{Guid.NewGuid().ToString("N")}.mp4";
                var webFilePath = Path.Combine(_convertedFolder, uniqueOutputName);

                _logger.LogInformation($"Bắt đầu chuyển đổi sang: {webFilePath}");

                bool conversionSuccess = await TryEnhancedFfmpegConversion(inputFilePath, webFilePath);

                if (!conversionSuccess)
                {
                    _logger.LogError("Quá trình chuyển đổi thất bại");
                    _logger.LogError($"Input path: {inputFilePath}, Output path: {webFilePath}");
                    return StatusCode(500, new { success = false, message = "Không thể chuyển đổi tệp âm thanh sang MP4. Vui lòng thử lại sau." });
                }

                // Kiểm tra file đầu ra
                if (!System.IO.File.Exists(webFilePath))
                {
                    _logger.LogError($"File đầu ra không tồn tại sau khi chuyển đổi: {webFilePath}");
                    return StatusCode(500, new { success = false, message = "File chuyển đổi không được tạo. Vui lòng thử lại." });
                }

                // Clean up temp file sau khi chuyển đổi thành công
                try
                {
                    if (System.IO.File.Exists(inputFilePath))
                    {
                        System.IO.File.Delete(inputFilePath);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Không thể xóa file tạm: {ex.Message}");
                    // Tiếp tục ngay cả khi xóa thất bại
                }

                return Ok(new
                {
                    success = true,
                    message = "Chuyển đổi thành công",
                    mp4Url = $"/converted/{uniqueOutputName}",
                    fileSize = new FileInfo(webFilePath).Length
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi trong ConvertToMP4");
                return StatusCode(500, new { success = false, message = $"Lỗi máy chủ: {ex.Message}" });
            }
        }

        [HttpGet]
        [Route("api/temp-file/{filename}")]
        public IActionResult GetTempFile(string filename)
        {
            var filePath = Path.Combine(_tempUploadPath, filename);
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound();
            }

            var fileExtension = Path.GetExtension(filename).ToLowerInvariant();
            var contentType = fileExtension switch
            {
                ".mp3" => "audio/mpeg",
                ".m4a" => "audio/mp4",
                ".wav" => "audio/wav",
                ".aac" => "audio/aac",
                ".mp4" => "video/mp4",
                _ => "application/octet-stream"
            };

            return PhysicalFile(filePath, contentType);
        }

        private async Task<bool> TryEnhancedFfmpegConversion(string inputPath, string outputPath)
        {
            try
            {
                _logger.LogInformation("Bắt đầu quá trình chuyển đổi FFmpeg");

                // Find ffmpeg executable path
                string ffmpegPath = await FindFfmpegPath();
                if (string.IsNullOrEmpty(ffmpegPath))
                {
                    _logger.LogError("FFmpeg không được tìm thấy trên hệ thống");
                    return false;
                }

                // Lệnh chuyển đổi đơn giản nhất, ưu tiên độ tương thích
                string command = $"-y -i \"{inputPath}\" -f lavfi -i color=c=black:s=640x360 -c:a aac -ar 44100 -shortest -c:v libx264 -preset ultrafast -pix_fmt yuv420p \"{outputPath}\"";

                var process = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = ffmpegPath,
                        Arguments = command,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    }
                };

                var errorOutput = new System.Text.StringBuilder();
                process.ErrorDataReceived += (sender, args) =>
                {
                    if (!string.IsNullOrEmpty(args.Data))
                    {
                        errorOutput.AppendLine(args.Data);
                        _logger.LogDebug($"FFmpeg: {args.Data}");
                    }
                };

                process.Start();
                process.BeginErrorReadLine();

                // Thêm timeout để tránh bị treo
                var processExited = await Task.Run(() => process.WaitForExit(180000)); // 3 phút timeout

                if (!processExited)
                {
                    _logger.LogWarning("FFmpeg quá trình chuyển đổi đã hết thời gian sau 3 phút");
                    try { process.Kill(); } catch { }
                    return false;
                }

                // Kiểm tra xem chuyển đổi có thành công không
                bool fileExists = System.IO.File.Exists(outputPath);
                long fileSize = fileExists ? new FileInfo(outputPath).Length : 0;

                if (process.ExitCode == 0 && fileExists && fileSize > 0)
                {
                    _logger.LogInformation($"Chuyển đổi thành công: {outputPath} đã tạo với kích thước {fileSize} bytes");
                    return true;
                }
                else
                {
                    _logger.LogWarning($"Lệnh thất bại với mã lỗi {process.ExitCode}. Lỗi: {errorOutput}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi trong quá trình chuyển đổi FFmpeg");
                return false;
            }
        }

        private async Task<string> FindFfmpegPath()
        {
            // Default ffmpeg executable
            string ffmpegPath = "ffmpeg";

            // Try testing if ffmpeg is available
            try
            {
                var testProcess = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = ffmpegPath,
                        Arguments = "-version",
                        RedirectStandardOutput = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    }
                };

                testProcess.Start();
                await testProcess.WaitForExitAsync();

                if (testProcess.ExitCode == 0)
                {
                    return ffmpegPath; // Default command works
                }
            }
            catch
            {
                // Default command didn't work, try other paths
            }

            // Try common locations for ffmpeg
            string[] possiblePaths = {
                "/usr/bin/ffmpeg",
                "/usr/local/bin/ffmpeg",
                "C:\\ffmpeg\\bin\\ffmpeg.exe",
                Path.Combine(_env.ContentRootPath, "ffmpeg", "ffmpeg.exe"),
                "/opt/homebrew/bin/ffmpeg" // For Mac
            };

            foreach (var path in possiblePaths)
            {
                if (System.IO.File.Exists(path))
                {
                    _logger.LogInformation($"Đã tìm thấy ffmpeg tại: {path}");
                    return path;
                }
            }

            return null; // FFmpeg not found
        }

        [HttpPost]
        [Route("api/youtube-upload")]
        public async Task<IActionResult> YouTubeUpload(IFormFile videoFile, string metadata, string accessToken, string refreshToken = null)
        {
            try
            {
                if (videoFile == null || videoFile.Length == 0)
                {
                    return BadRequest(new { success = false, message = "No video file provided" });
                }

                if (string.IsNullOrEmpty(accessToken))
                {
                    return BadRequest(new { success = false, message = "No access token provided" });
                }

                // Validate token first by making a simple API call
                bool tokenValid = await ValidateYouTubeToken(accessToken);
                _logger.LogInformation($"Initial token validation result: {tokenValid}");

                string effectiveAccessToken = accessToken;

                // If token is invalid but we have a refresh token, try refreshing
                if (!tokenValid && !string.IsNullOrEmpty(refreshToken))
                {
                    _logger.LogInformation("Token invalid, attempting refresh");
                    var refreshResult = await RefreshTokenInternal(refreshToken);

                    if (refreshResult.Success)
                    {
                        effectiveAccessToken = refreshResult.AccessToken;
                        tokenValid = true;
                        _logger.LogInformation("Token refreshed successfully");
                    }
                    else
                    {
                        _logger.LogError("Token refresh failed");
                        return StatusCode(401, new { success = false, message = "Access token expired and refresh failed" });
                    }
                }
                else if (!tokenValid)
                {
                    return StatusCode(401, new { success = false, message = "Access token is invalid or expired" });
                }
                // Save temp file
                var tempPath = Path.Combine(_env.ContentRootPath, "TempUploads", "YouTube");
                Directory.CreateDirectory(tempPath);
                var filePath = Path.Combine(tempPath, $"{Guid.NewGuid().ToString("N")}{Path.GetExtension(videoFile.FileName)}");

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await videoFile.CopyToAsync(stream);
                }

                // Parse metadata
                var videoMetadata = JsonSerializer.Deserialize<JsonElement>(metadata);
                var title = videoMetadata.GetProperty("snippet").GetProperty("title").GetString();
                var description = videoMetadata.GetProperty("snippet").GetProperty("description").GetString();
                var privacyStatus = videoMetadata.GetProperty("status").GetProperty("privacyStatus").GetString();

                // Get client credentials from configuration
                // TODO: Replace with actual configuration from appsettings.json or environment variables
                string clientId = "852976140693-oduglh7jqqvherl72khh8f3aouep2hlp.apps.googleusercontent.com"; // Replace with config value
                string clientSecret = "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"; // Replace with config value

                // Create YouTube service
                var credential = new UserCredential(
    new GoogleAuthorizationCodeFlow(
        new GoogleAuthorizationCodeFlow.Initializer
        {
            ClientSecrets = new ClientSecrets
            {
                ClientId = clientId,
                ClientSecret = clientSecret
            }
        }),
    "user",
    new TokenResponse
    {
        AccessToken = effectiveAccessToken,
        RefreshToken = refreshToken // thêm dòng này!
    });

                var youtubeService = new YouTubeService(new BaseClientService.Initializer()
                {
                    HttpClientInitializer = credential
                });

                // Create video and metadata
                var video = new YouTubeVideo
                {
                    Snippet = new YouTubeVideoSnippet
                    {
                        Title = title,
                        Description = description,
                        Tags = videoMetadata.GetProperty("snippet").TryGetProperty("tags", out var tags)
                            ? tags.EnumerateArray().Select(t => t.GetString()).ToList()
                            : new List<string>(),
                        CategoryId = "10" // Music category
                    },
                    Status = new YouTubeVideoStatus
                    {
                        PrivacyStatus = privacyStatus
                    }
                };

                // Create and execute upload request
                using (var fileStream = new FileStream(filePath, FileMode.Open))
                {
                    var videosInsertRequest = youtubeService.Videos.Insert(
                        video,
                        "snippet,status",
                        fileStream,
                        "video/*");

                    videosInsertRequest.ChunkSize = ResumableUpload.MinimumChunkSize;

                    var uploadProgress = await videosInsertRequest.UploadAsync();

                    if (uploadProgress.Status == UploadStatus.Failed)
                    {
                        throw new Exception($"Upload failed: {uploadProgress.Exception.Message}");
                    }

                    var uploadedVideo = videosInsertRequest.ResponseBody;

                    // Clean up temp file
                    try { System.IO.File.Delete(filePath); } catch { }

                    return Ok(new
                    {
                        success = true,
                        message = "Uploaded to YouTube successfully",
                        id = uploadedVideo.Id,
                        url = $"https://www.youtube.com/watch?v={uploadedVideo.Id}",
                        title = uploadedVideo.Snippet.Title,
                        status = uploadedVideo.Status.PrivacyStatus
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in YouTubeUpload");
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

            [HttpPost]
            public async Task<IActionResult> Upload(
                IFormFile file,
                string title,
                int artistId,
                string content,
                string genre,
                string era,
                string type,
                string description,
                string youtubeUrl = null,
                string youtubeVideoId = null,
                bool convertToMp4 = false) // Default is now false
            {
                try
                {
                    // Validate file
                    if (file == null || file.Length == 0)
                    {
                        return BadRequest(new { success = false, message = "Vui lòng chọn một tệp để tải lên." });
                    }

                    // Check file format
                    var allowedExtensions = new[] { ".mp3", ".m4a", ".wav", ".aac" };
                    var fileExtension = Path.GetExtension(file.FileName).ToLower();
                    if (!allowedExtensions.Contains(fileExtension))
                    {
                        return BadRequest(new { success = false, message = "Chỉ hỗ trợ các tệp MP3, M4A, WAV hoặc AAC." });
                    }

                    // Check song basic info
                    if (string.IsNullOrEmpty(title) || artistId <= 0)
                    {
                        return BadRequest(new { success = false, message = "Thiếu tiêu đề hoặc ID nghệ sĩ không hợp lệ." });
                    }

                    // Set default values for metadata if not provided
                    genre = string.IsNullOrEmpty(genre) ? "other" : genre;
                    era = string.IsNullOrEmpty(era) ? "20s" : era;
                    type = string.IsNullOrEmpty(type) ? "cover" : type;

                    // Convert to MP4 if explicitly requested or if YouTube info is provided
                    convertToMp4 = convertToMp4 || !string.IsNullOrEmpty(youtubeUrl) || !string.IsNullOrEmpty(youtubeVideoId);
                if (!convertToMp4 && (!string.IsNullOrEmpty(youtubeUrl) || !string.IsNullOrEmpty(youtubeVideoId)))
                {
                    convertToMp4 = true;
                }
                string fileUrl;

                    if (!convertToMp4)
                    {
                        // Save file in original format
                        var uniqueFileName = $"{Path.GetFileNameWithoutExtension(file.FileName)}_{Guid.NewGuid().ToString("N")}{fileExtension}";
                        var filePath = Path.Combine(_uploadsFolder, uniqueFileName);

                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        fileUrl = "/uploads/" + uniqueFileName;
                    }
                    else
                    {
                        // Save temp audio file
                        var tempFileName = $"{Path.GetFileNameWithoutExtension(file.FileName)}_{Guid.NewGuid().ToString("N")}{fileExtension}";
                        var tempFilePath = Path.Combine(_tempUploadPath, tempFileName);

                        using (var stream = new FileStream(tempFilePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        // Convert to MP4
                        var uniqueFileName = $"{Path.GetFileNameWithoutExtension(file.FileName)}_{Guid.NewGuid().ToString("N")}.mp4";
                        var outputPath = Path.Combine(_convertedFolder, uniqueFileName);

                        // Use enhanced conversion method
                        bool conversionSuccess = await TryEnhancedFfmpegConversion(tempFilePath, outputPath);

                        if (!conversionSuccess)
                        {
                            _logger.LogError("Conversion failed");
                            return StatusCode(500, new { success = false, message = "Không thể chuyển đổi tệp âm thanh. Vui lòng thử lại sau." });
                        }

                        // Clean up temp file
                        try
                        {
                            if (System.IO.File.Exists(tempFilePath))
                            {
                                System.IO.File.Delete(tempFilePath);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning($"Không thể xóa file tạm: {tempFilePath} - {ex.Message}");
                        }

                        fileUrl = "/converted/" + uniqueFileName;
                    }

                    // Create default content if none provided
                    var hasYouTubeInfo = !string.IsNullOrEmpty(youtubeUrl) && !string.IsNullOrEmpty(youtubeVideoId);

                    var postContent = !string.IsNullOrEmpty(description)
                        ? description
                        : !string.IsNullOrEmpty(content)
                            ? content
                            : $"Bài hát mới: {title}";

                    string linkYoutube = "";
                    if (hasYouTubeInfo)
                    {
                        linkYoutube = youtubeUrl;
                    }

                    // Create and save Post first
                    var post = new Post
                    {
                        UserId = artistId,
                        Content = postContent,
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now,
                        LinkYoutube = linkYoutube
                    };

                    _context.Posts.Add(post);
                    await _context.SaveChangesAsync(); // Save Post to get ID

                    // Create and save Song after Post ID is available
                    var song = new Song
                    {
                        Title = title,
                        ArtistId = artistId,
                        PostId = post.Id,             // Link to post
                        FileUrl = fileUrl,
                        Genre = genre,
                        Era = era,
                        Type = type,
                        UploadDate = DateTime.Now,
                        Status = "Public",
                        // Add YouTube info if available
                        YouTubeUrl = youtubeUrl,
                        YouTubeVideoId = youtubeVideoId
                    };

                    _context.Songs.Add(song);
                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        success = true,
                        message = hasYouTubeInfo
                            ? "Tải lên thành công cả hệ thống và YouTube!"
                            : "Tải lên thành công!",
                        fileUrl = song.FileUrl,
                        postId = post.Id,
                        songId = song.Id,
                        youtubeUrl = song.YouTubeUrl,
                        fileType = convertToMp4 ? "mp4" : fileExtension.TrimStart('.')
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Upload error");
                    return StatusCode(500, new { success = false, message = "Lỗi server: " + ex.Message });
                }
            }

            [Route("youtube-callback")]
            public IActionResult YouTubeCallback()
            {
                // Trang này sẽ được hiển thị sau khi xác thực với YouTube
                // Code sẽ được xử lý phía client-side bởi JavaScript
                return View();
            }
            [HttpPost]
            [Route("api/exchange-youtube-code")]
            public async Task<IActionResult> ExchangeYouTubeCode([FromBody] YouTubeCodeExchangeRequest request)
            {
                try
                {
                    if (string.IsNullOrEmpty(request.Code))
                    {
                        return BadRequest(new { success = false, message = "Authorization code is required" });
                    }

                    // These should come from configuration in production
                    string clientId = "852976140693-oduglh7jqqvherl72khh8f3aouep2hlp.apps.googleusercontent.com";
                    string clientSecret = "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";

                    // Create token exchange request
                    var tokenRequestParams = new Dictionary<string, string>
                {
                    { "code", request.Code },
                    { "client_id", clientId },
                    { "client_secret", clientSecret },
                    { "redirect_uri", request.RedirectUri },
                    { "grant_type", "authorization_code" }
                };

                    var content = new FormUrlEncodedContent(tokenRequestParams);

                    using (var httpClient = new HttpClient())
                    {
                        var response = await httpClient.PostAsync("https://oauth2.googleapis.com/token", content);
                        var responseContent = await response.Content.ReadAsStringAsync();

                        if (response.IsSuccessStatusCode)
                        {
                            var tokenInfo = JsonSerializer.Deserialize<JsonElement>(responseContent);

                            // Extract token information
                            string accessToken = tokenInfo.GetProperty("access_token").GetString();
                            int expiresIn = tokenInfo.GetProperty("expires_in").GetInt32();
                            string refreshToken = tokenInfo.TryGetProperty("refresh_token", out var refreshTokenProp)
                                ? refreshTokenProp.GetString()
                                : null;

                            // Calculate expiry timestamp
                            long expiresAt = DateTimeOffset.UtcNow.AddSeconds(expiresIn).ToUnixTimeMilliseconds();
                        _logger.LogInformation("✅ Refresh Token: " + refreshToken);

                        return Ok(new
                            {
                                success = true,
                                accessToken,
                                refreshToken,
                                expiresAt,
                                tokenType = tokenInfo.GetProperty("token_type").GetString()
                            });

                        }
                        else
                        {
                            _logger.LogError($"Token exchange failed: {responseContent}");
                            return StatusCode(500, new { success = false, message = "Failed to exchange code for tokens" });
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error exchanging YouTube auth code");
                    return StatusCode(500, new { success = false, message = $"Server error: {ex.Message}" });
                }
            }
            [HttpPost]
            [Route("api/refresh-youtube-token")]
            public async Task<IActionResult> RefreshYouTubeToken([FromBody] YouTubeTokenRefreshRequest request)
            {
                try
                {
                    if (string.IsNullOrEmpty(request.RefreshToken))
                    {
                        return BadRequest(new { success = false, message = "Refresh token is required" });
                    }

                    // These should come from configuration in production
                    string clientId = "852976140693-oduglh7jqqvherl72khh8f3aouep2hlp.apps.googleusercontent.com";
                    string clientSecret = "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";

                    // Create token refresh request
                    var refreshRequestParams = new Dictionary<string, string>
            {
                { "client_id", clientId },
                { "client_secret", clientSecret },
                { "refresh_token", request.RefreshToken },
                { "grant_type", "refresh_token" }
            };

                    var content = new FormUrlEncodedContent(refreshRequestParams);

                    using (var httpClient = new HttpClient())
                    {
                        var response = await httpClient.PostAsync("https://oauth2.googleapis.com/token", content);
                        var responseContent = await response.Content.ReadAsStringAsync();

                        if (response.IsSuccessStatusCode)
                        {
                            try
                            {
                                var tokenInfo = JsonSerializer.Deserialize<JsonElement>(responseContent);

                                // Extract token information
                                string accessToken = tokenInfo.GetProperty("access_token").GetString();
                                int expiresIn = tokenInfo.GetProperty("expires_in").GetInt32();

                                // Get new refresh token if provided
                                string newRefreshToken = tokenInfo.TryGetProperty("refresh_token", out var refreshTokenProp)
                                    ? refreshTokenProp.GetString()
                                    : null;

                                // Calculate expiry timestampf
                                long expiresAt = DateTimeOffset.UtcNow.AddSeconds(expiresIn).ToUnixTimeMilliseconds();

                                return Ok(new
                                {
                                    success = true,
                                    accessToken,
                                    refreshToken = newRefreshToken,
                                    expiresAt,
                                    tokenType = tokenInfo.GetProperty("token_type").GetString()
                                });
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, $"Failed to process successful refresh response: {responseContent}");
                                return StatusCode(500, new { success = false, message = "Invalid response from Google OAuth server" });
                            }
                        }
                        else
                        {
                            _logger.LogError($"Token refresh failed with status {response.StatusCode}: {responseContent}");
                            return StatusCode((int)response.StatusCode, new
                            {
                                success = false,
                                message = "Failed to refresh token",
                                details = responseContent
                            });
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error refreshing YouTube token");
                    return StatusCode(500, new { success = false, message = $"Server error: {ex.Message}" });
                }
            }
            private async Task<bool> ValidateYouTubeToken(string accessToken)
            {
                try
                {
                    using (var httpClient = new HttpClient())
                    {
                        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                        var response = await httpClient.GetAsync("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true");

                        if (!response.IsSuccessStatusCode)
                        {
                            string errorContent = await response.Content.ReadAsStringAsync();
                            _logger.LogWarning($"Token validation failed with status {response.StatusCode}: {errorContent}");
                        }

                        return response.IsSuccessStatusCode;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error validating YouTube token");
                    return false;
                }
            }
            private async Task<(bool Success, string AccessToken, string RefreshToken)> RefreshTokenInternal(string refreshToken)
            {
                try
                {
                    _logger.LogInformation($"Attempting to refresh token with refresh token: {refreshToken.Substring(0, 5)}...");

                    string clientId = "852976140693-oduglh7jqqvherl72khh8f3aouep2hlp.apps.googleusercontent.com";
                    string clientSecret = "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";

                    var refreshRequestParams = new Dictionary<string, string>
            {
                { "client_id", clientId },
                { "client_secret", clientSecret },
                { "refresh_token", refreshToken },
                { "grant_type", "refresh_token" }
            };

                    var content = new FormUrlEncodedContent(refreshRequestParams);

                    using (var httpClient = new HttpClient())
                    {
                        httpClient.Timeout = TimeSpan.FromSeconds(15); // Set timeout to avoid hanging

                        var response = await httpClient.PostAsync("https://oauth2.googleapis.com/token", content);
                        var responseContent = await response.Content.ReadAsStringAsync();

                        _logger.LogInformation($"Refresh token response status: {response.StatusCode}");

                        if (response.IsSuccessStatusCode)
                        {
                            try
                            {
                                var tokenInfo = JsonSerializer.Deserialize<JsonElement>(responseContent);
                                string accessToken = tokenInfo.GetProperty("access_token").GetString();

                                // Get new refresh token if one was returned (not always the case)
                                string newRefreshToken = null;
                                if (tokenInfo.TryGetProperty("refresh_token", out var refreshTokenProp))
                                {
                                    newRefreshToken = refreshTokenProp.GetString();
                                }

                                _logger.LogInformation("Token refreshed successfully");
                                return (true, accessToken, newRefreshToken);
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, $"Failed to parse successful refresh response: {responseContent}");
                                return (false, null, null);
                            }
                        }
                        else
                        {
                            _logger.LogError($"Token refresh failed: {responseContent}");
                            return (false, null, null);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in internal token refresh");
                    return (false, null, null);
                }
            }
            public class YouTubeCodeExchangeRequest
            {
                public string Code { get; set; }
                public string RedirectUri { get; set; }
            }

            public class YouTubeTokenRefreshRequest
            {
                public string RefreshToken { get; set; }
            }
            // Add input model to support AddComment method
            public class CommentInputModel
            {
                public int UserId { get; set; }
                public string Content { get; set; }
            }

        }
    }