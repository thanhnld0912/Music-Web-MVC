using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MusicWebMVC.Data;
using MusicWebMVC.Hubs;
using MusicWebMVC.Models;


namespace MusicWebMVC.Controllers
{
    public class UserController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;
        public UserController(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }


        // This method now handles viewing any user's profile
        public async Task<IActionResult> Profile(int id)
        {
            // Kiểm tra xem người dùng có đang đăng nhập và có quyền xem hồ sơ của người khác không
            int currentUserId = 0;
            if (int.TryParse(HttpContext.Session.GetString("UserId"), out currentUserId) && currentUserId == id)
            {
                // Nếu người dùng đang xem chính hồ sơ của mình, chuyển hướng tới trang profile của tài khoản
                return RedirectToAction("Profile", "Account");
            }

            // Otherwise, show the requested user's profile
            var user = await _context.Users
                .Include(u => u.Posts)
                    .ThenInclude(p => p.Song)
                .FirstOrDefaultAsync(u => u.Id == id);

            // Nếu không tìm thấy người dùng, trả về NotFound
            if (user == null)
            {
                return NotFound();
            }

            // Kiểm tra xem người dùng hiện tại có đang theo dõi người dùng này không
            bool isFollowing = false;
            if (currentUserId > 0)
            {
                isFollowing = await _context.Follows
                    .AnyAsync(f => f.FollowerId == currentUserId && f.FollowingId == id);
            }

            ViewBag.IsFollowing = isFollowing;
            return View(user);
        }


        // Follow/Unfollow methods remain the same
        [HttpPost]
        public async Task<IActionResult> Follow(int followingId)
        {
            // Check if user is authenticated
            if (!int.TryParse(HttpContext.Session.GetString("UserId"), out int currentUserId))
            {
                return Json(new { success = false, message = "User not authenticated" });
            }

            try
            {
                // Check if users exist
                var currentUser = await _context.Users.FindAsync(currentUserId);
                var userToFollow = await _context.Users.FindAsync(followingId);

                if (currentUser == null || userToFollow == null)
                {
                    return Json(new { success = false, message = "User not found" });
                }

                // Prevent following oneself
                if (currentUserId == followingId)
                {
                    return Json(new { success = false, message = "Cannot follow yourself" });
                }

                // Check if already following
                var existingFollow = await _context.Follows
                    .FirstOrDefaultAsync(f => f.FollowerId == currentUserId && f.FollowingId == followingId);

                if (existingFollow != null)
                {
                    return Json(new { success = false, message = "Already following this user" });
                }

                // Create new follow relationship
                var follow = new Follow
                {
                    FollowerId = currentUserId,
                    FollowingId = followingId,
                    FollowedAt = DateTime.Now
                };

                _context.Follows.Add(follow);

                // Create notification for the user being followed
                var notification = new Notification
                {
                    UserId = followingId, // User being followed receives notification
                    PostId = null, // No post associated with follow action
                    Type = "Follow",
                    Url = $"/Home/ProfileUser?id={currentUserId}", // Link to follower's profile
                    Message = $"{currentUser.Username} started following you."
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                // Send real-time notification via SignalR
                string receiverUserId = followingId.ToString();
                await _hubContext.Clients.Group(receiverUserId).SendAsync(
                    "ReceiveNotification",
                    receiverUserId,
                    notification.Message,
                    notification.Type,
                    notification.Url
                );

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.InnerException?.Message ?? ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred",
                    error = ex.InnerException?.Message ?? ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Unfollow(int followingId)
        {
            // Existing code remains unchanged
            // Check if user is authenticated
            if (!int.TryParse(HttpContext.Session.GetString("UserId"), out int currentUserId))
            {
                return Json(new { success = false, message = "User not authenticated" });
            }
            // Find the follow relationship
            var follow = await _context.Follows
                .FirstOrDefaultAsync(f => f.FollowerId == currentUserId && f.FollowingId == followingId);
            if (follow == null)
            {
                return Json(new { success = false, message = "Follow relationship not found" });
            }
            // Remove follow relationship
            _context.Follows.Remove(follow);
            await _context.SaveChangesAsync();
            return Json(new { success = true });
        }
        [HttpGet]
        public IActionResult CheckVipStatus()
        {
            try
            {
                // Get current user ID
                int userId = 0;
                int.TryParse(HttpContext.Session.GetString("UserId"), out userId);

                if (userId <= 0)
                {
                    return Unauthorized(new { isVip = false, message = "You need to be logged in to use this feature" });
                }


                // Real implementation would check if the user has VIP role
                var user = _context.Users.FirstOrDefault(u => u.Id == userId);

                bool isVip = user != null && user.IsVIP == true;

                return Ok(new
                {
                    isVip = isVip,
                    message = isVip ? "VIP user confirmed" : "This feature requires a VIP subscription"
                });

            }
            catch (Exception ex)
            {
                return StatusCode(500, new { isVip = false, message = "Server error: " + ex.Message });
            }
        }
    }
}
