//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;
//using MusicWebMVC.Data;
//using MusicWebMVC.Helpers;
//using MusicWebMVC.ViewModels;

//namespace MusicWebMVC.Controllers
//{
//    public class AdminController : Controller
//    {
//        private readonly ApplicationDbContext _context;

//        public AdminController(ApplicationDbContext context)
//        {
//            _context = context;
//        }

//        public IActionResult Dashboard()
//        {
//            ViewData["ActiveTab"] = "dashboard";
//            return View("Dashboard");
//        }

//        //public IActionResult User()
//        //{
//        //    return View();
//        //}

//        public IActionResult Post(int page = 1, int pageSize = 4)
//        { 
//            var posts = _context.Posts
//                .Select(p => new PostViewModel
//                {
//                    Id = p.Id,
//                    Username = p.User.Username,
//                    Title = p.Song.Title,
//                    Status = p.Song.Status 
//                })
//                .ToList();

//            var totalItems = posts.Count;
//            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

//            var pagePosts = posts
//                .Skip((page - 1) * pageSize)
//                .Take(pageSize)
//                .ToList();

//            var result = new PagedResult<PostViewModel>
//            {
//                Items = pagePosts,
//                CurrentPage = page,
//                TotalPages = totalPages,
//                PageSize = pageSize,
//                TotalItems = totalItems,
//            };

//            ViewData["ActiveTab"] = "post";
//            return View("Dashboard", result);
//        }

//        public IActionResult User(int page = 1, int pageSize = 4)
//        {
//            var users = _context.Users
//                .Where(u => u.Role == "User")
//                .Select(u => new UserViewModel
//                {
//                    Id = u.Id,
//                    Username = u.Username,
//                    Email = u.Email,
//                    PostCount = u.Posts.Count(),
//                    IsDisabled = u.IsDisabled
//                })
//                .ToList();

//            var totalItems = users.Count;
//            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

//            var pageUsers = users
//                .Skip((page - 1) * pageSize)
//                .Take(pageSize)
//                .ToList();

//            var result = new PagedResult<UserViewModel>
//            {
//                Items = pageUsers,
//                CurrentPage = page,
//                TotalPages = totalPages,
//                PageSize = pageSize,
//                TotalItems = totalItems,
//            };

//            ViewData["ActiveTab"] = "user";
//            return View("Dashboard", result);
//        }

//        public IActionResult DeleteUser(int id)
//        {
//            var user = _context.Users.FirstOrDefault(u => u.Id == id);

//            if (user == null)
//            {
//                TempData["Error"] = "User not found";
//                return RedirectToAction("User");
//            }

//            _context.Users.Remove(user);
//            _context.SaveChanges();

//            TempData["Success"] = "User deleted successfully";
//            return RedirectToAction("User");
//        }

//        public IActionResult DisableUser(int id)
//        {
//            var user = _context.Users.FirstOrDefault(u => u.Id == id);

//            if (user != null)
//            {
//                user.IsDisabled = true;
//                _context.SaveChanges();
//            }
//            return RedirectToAction("User");
//        }

//        public IActionResult EnableUser(int id)
//        {
//            var user = _context.Users.FirstOrDefault(u => u.Id == id);

//            if (user != null)
//            {
//                user.IsDisabled = false;
//                _context.SaveChanges();
//            }
//            return RedirectToAction("User");
//        }
//    }
//}
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using MusicWebMVC.Data;
using MusicWebMVC.Helpers;
using MusicWebMVC.ViewModels;
using System.Security.Claims;

namespace MusicWebMVC.Controllers
{
    public class BaseController : Controller
    {
        protected readonly ApplicationDbContext _context;

        public BaseController(ApplicationDbContext context)
        {
            _context = context;
        }

        public override void OnActionExecuting(ActionExecutingContext context)
        {
            base.OnActionExecuting(context);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(userId))
            {
                var user = _context.Users.FirstOrDefault(u => u.Id.ToString() == userId);
                if (user != null)
                {
                    user.LastActivity = DateTime.UtcNow;
                    _context.SaveChanges();
                }
            }
        }
    }

    public class AdminController : BaseController
    {
        public AdminController(ApplicationDbContext context) : base(context) { }

        public IActionResult Dashboard()
        {
            ViewData["ActiveTab"] = "dashboard";

            var onlineThreshold = DateTime.UtcNow.AddMinutes(-1);
            int activeUserCount = _context.Users
                .Where(u => u.Role == "User" && u.LastActivity >= onlineThreshold)
                .Count();

            int userCount = _context.Users
                .Where(u => u.Role == "User" && !u.IsDisabled)
                .Count();

            int vipUser = _context.Users
                .Where(u => u.Role == "User" && u.IsVIP && !u.IsDisabled)
                .Count();

            // Lấy số lượng người dùng theo tháng
            var currentYear = DateTime.Now.Year;
            var monthlyStats = _context.Users
                .Where(u => u.Role == "User" && u.CreatedAt.Year == currentYear)
                .GroupBy(u => u.CreatedAt.Month)
                .Select(g => new {
                    Month = g.Key,
                    Total = g.Count(),
                    VIP = g.Count(x => x.IsVIP),
                    Active = g.Count(x => x.LastActivity >= DateTime.UtcNow.AddMinutes(-1))
                    //Active = g.Count(x => x.IsActive == true)
                })
                .ToList();

            // Truyền sang ViewBag để dùng trong JavaScript
            ViewBag.MonthlyLabels = Enumerable.Range(1, 12).Select(m => new DateTime(1, m, 1).ToString("MMM")).ToArray();
            ViewBag.MonthlyUsers = Enumerable.Range(1, 12).Select(m => monthlyStats.FirstOrDefault(s => s.Month == m)?.Total ?? 0).ToArray();
            ViewBag.MonthlyVIPs = Enumerable.Range(1, 12).Select(m => monthlyStats.FirstOrDefault(s => s.Month == m)?.VIP ?? 0).ToArray();
            ViewBag.MonthlyActive = Enumerable.Range(1, 12).Select(m => monthlyStats.FirstOrDefault(s => s.Month == m)?.Active ?? 0).ToArray();

            ViewData["Upgrades"] = vipUser;
            ViewData["Users"] = userCount;
            ViewData["ActiveUsers"] = activeUserCount;

            return View("Dashboard");
        }

        public IActionResult Post(int page = 1, int pageSize = 4)
        {
            var posts = _context.Posts
                .Select(p => new PostViewModel
                {
                    Id = p.Id,
                    Username = p.User.Username,
                    Title = p.Song.Title,
                    Status = p.Song.Status
                })
                .ToList();

            var totalItems = posts.Count;
            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            var pagePosts = posts
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var result = new PagedResult<PostViewModel>
            {
                Items = pagePosts,
                CurrentPage = page,
                TotalPages = totalPages,
                PageSize = pageSize,
                TotalItems = totalItems,
            };

            ViewData["ActiveTab"] = "post";
            return View("Dashboard", result);
        }

        public IActionResult User(int page = 1, int pageSize = 4)
        {
            var users = _context.Users
                .Where(u => u.Role == "User")
                .Select(u => new UserViewModel
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    PostCount = u.Posts.Count(),
                    IsDisabled = u.IsDisabled,
                    IsVIP = u.IsVIP,
                    IsActive = u.IsActive,
                    LastActivity = u.LastActivity
                })
                .ToList();

            var totalItems = users.Count;
            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            var pageUsers = users
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var result = new PagedResult<UserViewModel>
            {
                Items = pageUsers,
                CurrentPage = page,
                TotalPages = totalPages,
                PageSize = pageSize,
                TotalItems = totalItems,
            };

            ViewData["ActiveTab"] = "user";
            return View("Dashboard", result);
        }

        public IActionResult DeleteUser(int id)
        {
            var user = _context.Users.FirstOrDefault(u => u.Id == id);

            if (user == null)
            {
                TempData["Error"] = "User not found";
                return RedirectToAction("User");
            }

            _context.Users.Remove(user);
            _context.SaveChanges();

            TempData["Success"] = "User deleted successfully";
            return RedirectToAction("User");
        }

        public IActionResult DisableUser(int id)
        {
            var user = _context.Users.FirstOrDefault(u => u.Id == id);

            if (user != null)
            {
                user.IsDisabled = true;
                _context.SaveChanges();
            }
            return RedirectToAction("User");
        }

        public IActionResult EnableUser(int id)
        {
            var user = _context.Users.FirstOrDefault(u => u.Id == id);

            if (user != null)
            {
                user.IsDisabled = false;
                _context.SaveChanges();
            }
            return RedirectToAction("User");
        }

        [HttpGet]
        public IActionResult GetReportsByPost(int postId)
        {
            var reports = _context.PostReports
                .Include(r => r.User)
                .Join(
                    _context.Posts,
                    report => report.PostId,
                    post => post.Id,
                    (report, post) => new
                    {
                        report.Id,
                        Username = report.User.Username,
                        report.Reason,
                        CreatedAt = report.CreatedAt.ToString("dd/MM/yyyy HH:mm"),
                        report.Resolved,
                        PostId = report.PostId,
                        PostContent = post.Content,
                        PostUserId = post.UserId,
                        PostCreatedAt = post.CreatedAt.ToString("dd/MM/yyyy HH:mm"),
                        PostUpdatedAt = post.UpdatedAt.ToString("dd/MM/yyyy HH:mm"),
                        // Join Users table to get the Username for the Post UserId
                        PostUserUsername = _context.Users
                            .Where(u => u.Id == post.UserId)
                            .Select(u => u.Username)
                            .FirstOrDefault()
                    })
                .Where(r => r.PostId == postId)
                .ToList();

            return Json(reports);
        }

        [HttpPost]
        public IActionResult ResolveReport(int id)
        {
            var report = _context.PostReports.Find(id);
            if (report == null) return NotFound();

            report.Resolved = true;
            report.ResolvedAt = DateTime.Now;
            _context.SaveChanges();

            return Ok();
        }

        public IActionResult DeletePost(int id)
        {
            var post = _context.Posts
                .Include(p => p.Comments)
                .Include(p => p.Likes)
                .Include(p => p.Dislikes)
                .Include(p => p.PostReports)
                .FirstOrDefault(p => p.Id == id);

            if (post == null)
            {
                TempData["Error"] = "Post not found";
                return RedirectToAction("Post");
            }

            // Xóa các thực thể liên quan trước
            _context.Comments.RemoveRange(post.Comments);
            _context.Likes.RemoveRange(post.Likes);
            _context.Dislikes.RemoveRange(post.Dislikes);
            _context.PostReports.RemoveRange(post.PostReports);

            _context.Posts.Remove(post);
            _context.SaveChanges();

            TempData["Success"] = "Post deleted successfully";
            return RedirectToAction("Post");
        }


    }
}
