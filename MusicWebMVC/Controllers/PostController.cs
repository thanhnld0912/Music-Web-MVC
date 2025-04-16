    using Microsoft.AspNetCore.Mvc;
    using Microsoft.EntityFrameworkCore;
    using MusicWebMVC.Models;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Http;
    using Microsoft.AspNetCore.Hosting;
    using System.IO;
    using MusicWebMVC.Data;
    using Microsoft.Extensions.Hosting;
    using System.ComponentModel.Design;
using Microsoft.AspNetCore.SignalR;
using MusicWebMVC.Hubs;

    namespace MusicWebMVC.Controllers
    {
        public class PostController : Controller
        {
            private readonly ApplicationDbContext _context;
            private readonly IWebHostEnvironment _env;
        private readonly IHubContext<NotificationHub> _hubContext;

        public PostController(ApplicationDbContext context, IWebHostEnvironment env, IHubContext<NotificationHub> hubContext)
            {
                _context = context;
                _env = env;
            _hubContext = hubContext;
        }

            [HttpPost]
            public async Task<IActionResult> LikePost(int id, [FromBody] int userId, [FromQuery] string type = "post")
            {
                try
                {
                    // Xác định loại (post hoặc song)
                    bool isPost = type.ToLower() == "post";

                    // Xóa dislike nếu có
                    var existingDislike = await _context.Dislikes
                        .FirstOrDefaultAsync(d =>
                            (isPost ? d.PostId == id : d.SongId == id) &&
                            d.UserId == userId);

                    if (existingDislike != null)
                    {
                        _context.Dislikes.Remove(existingDislike);
                    }

                    // Kiểm tra like hiện có
                    var existingLike = await _context.Likes
                        .FirstOrDefaultAsync(l =>
                            (isPost ? l.PostId == id : l.SongId == id) &&
                            l.UserId == userId);

                    if (existingLike != null)
                    {
                        _context.Likes.Remove(existingLike);
                        await _context.SaveChangesAsync();
                        return Ok(new { message = "Like removed successfully" });
                    }
                    else
                    {
                        // Tạo like mới
                        var like = new Like
                        {
                            UserId = userId,
                            PostId = isPost ? id : null,
                            SongId = isPost ? null : id,
                            CreatedAt = DateTime.UtcNow
                        };

                        _context.Likes.Add(like);
                        await _context.SaveChangesAsync();

                        var postOwnerId = await _context.Posts
        .Where(p => p.Id == id)
        .Select(p => p.UserId)
        .FirstOrDefaultAsync();
                    var user = await _context.Users.FindAsync(userId);
                    string username = user?.Username ?? "Unknown User";
                    if (postOwnerId != userId)
                        {
                            var notification = new Notification
                            {
                                UserId = postOwnerId,
                                PostId = id,
                                Type = "Like",
                                Url = $"/Home/PostDetail?id={id}",
                                Message = $"{username} liked your post."
                            };

                            _context.Notifications.Add(notification);
                            await _context.SaveChangesAsync();

                        string receiverUserId = notification.UserId.ToString();
                        await _hubContext.Clients.Group(receiverUserId).SendAsync(
                            "ReceiveNotification",
                            receiverUserId,
                            notification.Message,
                            notification.Type,
                            notification.Url
                        
    );
                    }
                        return Ok(new { message = "Liked successfully" });
                    }
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { message = "An error occurred", error = ex.Message });
                }
            }

            [HttpPost]
            public async Task<IActionResult> DislikePost(int id, [FromBody] int userId)
            {
                try
                {
                    // Kiểm tra xem người dùng đã like bài viết này chưa
                    var existingLike = await _context.Likes
                        .FirstOrDefaultAsync(l => l.PostId == id && l.UserId == userId);

                    if (existingLike != null)
                    {
                        // Nếu đã like, xóa like
                        _context.Likes.Remove(existingLike);
                    }

                    // Kiểm tra xem người dùng đã dislike bài viết này chưa
                    var existingDislike = await _context.Dislikes
                        .FirstOrDefaultAsync(d => d.PostId == id && d.UserId == userId);

                    if (existingDislike != null)
                    {
                        // Nếu đã dislike, xóa dislike (để hủy dislike)
                        _context.Dislikes.Remove(existingDislike);
                        await _context.SaveChangesAsync();
                        return Ok(new { message = "Dislike removed successfully" });
                    }
                    else
                    {
                        // Nếu chưa dislike, thêm dislike mới
                        var dislike = new Dislike { UserId = userId, PostId = id, CreatedAt = DateTime.UtcNow };
                        _context.Dislikes.Add(dislike);
                        await _context.SaveChangesAsync();


                        var postOwnerId = await _context.Posts
    .Where(p => p.Id == id)
    .Select(p => p.UserId)
    .FirstOrDefaultAsync();


                    var user = await _context.Users.FindAsync(userId);
                    string username = user?.Username ?? "Unknown User";

                    if (postOwnerId != userId)
                        {
                            var notification = new Notification
                            {
                                UserId = postOwnerId,
                                PostId = id,
                                Type = "Dislike",
                                Url = $"/Home/PostDetail?id={id}",

                                Message = $"{username} disliked your post."
                            };
                            _context.Notifications.Add(notification);
                            await _context.SaveChangesAsync();
                        string receiverUserId = notification.UserId.ToString();
                        await _hubContext.Clients.Group(receiverUserId).SendAsync(
                            "ReceiveNotification",
                            receiverUserId,
                            notification.Message,
                            notification.Type,
                            notification.Url
                        );
                    }
                        return Ok(new { message = "Post disliked successfully" });
                    }
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { message = "An error occurred", error = ex.Message });
                }
            }

            [HttpGet]
            public async Task<IActionResult> GetComments(int id)
            {
                try
                {
                    var comments = await _context.Comments
                        .Include(c => c.User)
                        .Where(c => c.PostId == id)
                        .OrderBy(c => c.CreatedAt)
                        .Select(c => new
                        {
                            id = c.Id,
                            content = c.Content,
                            userId = c.UserId,
                            userName = c.User.Username,
                            createdAt = c.CreatedAt,
                            avatarUrl = c.User.AvatarUrl
                        })
                        .ToListAsync();

                    return Json(comments);
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { message = "An error occurred", error = ex.Message });
                }
            }

        [HttpPost]
        public async Task<IActionResult> AddComment(int id, [FromBody] CommentInputModel comment)
        {
            if (id <= 0) return BadRequest("Invalid PostId");
            try
            {
                if (comment == null || string.IsNullOrWhiteSpace(comment.Content))
                {
                    return BadRequest(new { message = "Comment content cannot be empty" });
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

                var postOwnerId = await _context.Posts
                    .Where(p => p.Id == id)
                    .Select(p => p.UserId)
                    .FirstOrDefaultAsync();


                // Don't send notification to yourself
                if (postOwnerId != comment.UserId)
                {
                    var notification = new Notification
                    {
                        UserId = postOwnerId,
                        PostId = id,
                        Type = "Comment",
                        Url = $"/Home/PostDetail?id={id}",

                        Message = $"{username} commented on your post."
                    };

                    _context.Notifications.Add(notification);
                    await _context.SaveChangesAsync();
                    // Đảm bảo chuyển đổi userId sang string
                    string receiverUserId = notification.UserId.ToString();
                    await _hubContext.Clients.Group(receiverUserId).SendAsync(
                        "ReceiveNotification",
                        receiverUserId,
                        notification.Message,
                        notification.Type,
                        notification.Url
                    );
                }

                // Move this return statement outside the if block to ensure it's always returned
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

        [HttpGet]
            public IActionResult GetCommentCount(int id)
            {
                var post = _context.Posts
                    .Include(p => p.Comments)
                    .FirstOrDefault(p => p.Id == id);

                if (post == null)
                {
                    return NotFound();
                }

                int commentCount = post.Comments?.Count ?? 0;
                return Json(commentCount);
            }

            // New methods for editing and deleting posts

            [HttpGet]
            public async Task<IActionResult> GetPost(int id)
            {
                try
                {
                    var post = await _context.Posts
                        .Include(p => p.User)
                        .Include(p => p.Song)
                        .FirstOrDefaultAsync(p => p.Id == id);

                    if (post == null)
                    {
                        return NotFound(new { message = "Post not found" });
                    }

                    // Return post details
                    return Json(new
                    {
                        id = post.Id,
                        content = post.Content,
                        imageUrl = post.ImageUrl,
                        userId = post.UserId,
                        username = post.User.Username,
                        songId = post.Song?.Id,
                        songTitle = post.Song?.Title,
                        createdAt = post.CreatedAt
                    });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { message = "An error occurred", error = ex.Message });
                }
            }

            [HttpPost]
            public async Task<IActionResult> EditPost(int id, [FromBody] PostEditModel model)
            {
                try
                {
                    var post = await _context.Posts.FindAsync(id);

                    if (post == null)
                    {
                        return NotFound(new { message = "Post not found" });
                    }

                    // Check if the user is the post owner
                    if (post.UserId != model.UserId)
                    {
                        return Forbid();
                    }

                    // Update post content
                    post.Content = model.Content;

                    // Handle image update if needed
                    if (model.ImageUrl != null && model.ImageUrl != post.ImageUrl)
                    {
                        // If there's a new image, we would handle image upload here
                        // For now, we'll just update the URL
                        post.ImageUrl = model.ImageUrl;
                    }

                    // Update the modification timestamp
                    post.UpdatedAt = DateTime.UtcNow;

                    _context.Posts.Update(post);
                    await _context.SaveChangesAsync();

                    return Ok(new { message = "Post updated successfully", post });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { message = "An error occurred", error = ex.Message });
                }
            }

            [HttpPost]
            public async Task<IActionResult> DeletePost(int id, [FromBody] int userId)
            {
                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    var post = await _context.Posts
                        .Include(p => p.Comments)
                        .Include(p => p.Likes)
                        .Include(p => p.Dislikes)
                        .FirstOrDefaultAsync(p => p.Id == id);

                    if (post == null)
                    {
                        return NotFound(new { message = "Post not found" });
                    }

                    // Check if the user is the post owner
                    if (post.UserId != userId)
                    {
                        return Forbid();
                    }

                    // Remove related entities first
                    if (post.Comments?.Any() == true)
                    {
                        _context.Comments.RemoveRange(post.Comments);
                    }

                    if (post.Likes?.Any() == true)
                    {
                        _context.Likes.RemoveRange(post.Likes);
                    }

                    if (post.Dislikes?.Any() == true)
                    {
                        _context.Dislikes.RemoveRange(post.Dislikes);
                    }

                    // Remove the post
                    _context.Posts.Remove(post);

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(new { message = "Post deleted successfully" });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();

                    // Log the full exception including inner exceptions
                    var fullErrorMessage = ex.ToString();
                    // You should log this with your logging framework

                    return StatusCode(500, new
                    {
                        message = "An error occurred",
                        error = ex.Message,
                        innerError = ex.InnerException?.Message
                    });
                }
            }

            [HttpPost]
            public async Task<IActionResult> EditComment(int id, [FromBody] CommentEditModel model)
            {
                try
                {
                    var comment = await _context.Comments.FindAsync(id);

                    if (comment == null)
                    {
                        return NotFound(new { message = "Comment not found" });
                    }

                    // Check if the user is the comment owner
                    if (comment.UserId != model.UserId)
                    {
                        return Forbid();
                    }

                    // Update comment content
                    comment.Content = model.Content;
                    comment.UpdatedAt = DateTime.UtcNow;

                    _context.Comments.Update(comment);
                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        message = "Comment updated successfully",
                        comment = new
                        {
                            id = comment.Id,
                            content = comment.Content,
                            updatedAt = comment.UpdatedAt
                        }
                    });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { message = "An error occurred", error = ex.Message });
                }
            }

            [HttpPost]
            public async Task<IActionResult> DeleteComment(int id, [FromBody] int userId)
            {
                try
                {
                    var comment = await _context.Comments.FindAsync(id);

                    if (comment == null)
                    {
                        return NotFound(new { message = "Comment not found" });
                    }

                    // Check if the user is the comment owner
                    if (comment.UserId != userId)
                    {
                        return Forbid();
                    }

                    _context.Comments.Remove(comment);
                    await _context.SaveChangesAsync();

                    return Ok(new { message = "Comment deleted successfully" });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { message = "An error occurred", error = ex.Message });
                }
            }
        [HttpPost]
        public async Task<IActionResult> ReportComment(int id, [FromBody] CommentReportModel model)
        {
            try
            {
                var comment = await _context.Comments.FindAsync(id);

                if (comment == null)
                {
                    return NotFound(new { message = "Comment not found" });
                }

                var userId = await _context.Comments
                    .Where(c => c.Id == id)
                    .Select(c => c.UserId)
                    .FirstOrDefaultAsync();

                var existingReport = await _context.CommentReports
                    .FirstOrDefaultAsync(r => r.CommentId == id && r.UserId == userId);

                if (existingReport != null)
                {
                    return BadRequest("You have already reported this comment.");
                }

                // Create a new report
                var report = new CommentReport
                {
                    CommentId = id,
                    UserId = model.UserId,
                    Reason = model.Reason,
                    CreatedAt = DateTime.UtcNow
                };

                _context.CommentReports.Add(report);
                await _context.SaveChangesAsync();

                // Add notification if reporter is different from comment author
                if (comment.UserId != userId)
                {
                    var username = await _context.Users
                        .Where(u => u.Id == userId)
                        .Select(u => u.Username)
                        .FirstOrDefaultAsync();

                    var postId = await _context.Comments
                        .Where(c => c.Id == id)
                        .Select(c => c.PostId)
                        .FirstOrDefaultAsync();

                    var notification = new Notification
                    {
                        UserId = comment.UserId, // Comment author receives notification
                        PostId = postId,
                        Type = "ReportComment",
                        Url = $"/Song/SongPage?postId={id}",
                        Message = $"{username} reported your comment."
                    };

                    _context.Notifications.Add(notification);
                    await _context.SaveChangesAsync();
                }

                // Add this return statement to handle all code paths
                return Ok(new { message = "Comment reported successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

    }
    }