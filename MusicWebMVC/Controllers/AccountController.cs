using Microsoft.AspNetCore.Mvc;
using MusicWebMVC.Data;
using MusicWebMVC.Models;

namespace MusicWebMVC.Controllers
{
    public class AccountController : Controller
    {
        private readonly ApplicationDbContext _context;

        public AccountController(ApplicationDbContext context)
        {
            _context = context;
        }

        public IActionResult Profile()
        {
            var userId = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userId))
            {
                return RedirectToAction("Login");
            }

            var user = _context.Users.FirstOrDefault(u => u.Id.ToString() == userId);
            if (user == null)
            {
                return RedirectToAction("Login");
            }

            // Truyền đối tượng người dùng vào View
            return View(user);
        }
        public IActionResult ProfileAdmin()
        {
            var userId = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userId))
            {
                return RedirectToAction("Login");
            }

            var user = _context.Users.FirstOrDefault(u => u.Id.ToString() == userId);
            if (user == null)
            {
                return RedirectToAction("Login");
            }

            return View(user);
        }
        public IActionResult GetPassword()
        {
            var userId = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userId))
            {
                return Json(new { success = false, message = "User not authenticated" });
            }

            var user = _context.Users.FirstOrDefault(u => u.Id.ToString() == userId);
            if (user == null)
            {
                return Json(new { success = false, message = "User not found" });
            }

            // Không trả về mật khẩu thực tế, mà chỉ cần trả lại mật khẩu thực tế
            var password = user.Password;  // Đây là mật khẩu đã mã hóa (nếu cần)

            return Json(new { success = true, password = password });
        }


        [HttpPost]
        public IActionResult UpdateProfile([FromBody] User updatedUser)
        {
            // Lấy UserId từ session
            var userId = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userId))
            {
                return Json(new { success = false, message = "User not authenticated" });
            }

            // Tìm kiếm người dùng trong cơ sở dữ liệu
            var user = _context.Users.FirstOrDefault(u => u.Id.ToString() == userId);
            if (user == null)
            {
                return Json(new { success = false, message = "User not found" });
            }

            // Cập nhật thông tin người dùng
            user.Username = updatedUser.Username;
            user.Email = updatedUser.Email;
            user.Bio = updatedUser.Bio;

            // Cập nhật mật khẩu nếu có
            if (!string.IsNullOrEmpty(updatedUser.Password))
            {
                user.Password = updatedUser.Password;
            }

            // Lưu thay đổi vào cơ sở dữ liệu
            _context.SaveChanges();

            // Cập nhật lại thông tin trong session
            HttpContext.Session.SetString("Username", user.Username);
            HttpContext.Session.SetString("Email", user.Email);
            HttpContext.Session.SetString("Bio", user.Bio);

            return Json(new { success = true });
        }
        public IActionResult Login()
        {
            return View();
        }

        public IActionResult Loader()
        {
            return View();
        }

        [HttpPost]
        public IActionResult Login(string email, string password)
        {
            var user = _context.Users.FirstOrDefault(u => u.Email == email && u.Password == password);

            if (user != null)
            {
                // Lưu thông tin người dùng vào session
                HttpContext.Session.SetString("UserId", user.Id.ToString());
                HttpContext.Session.SetString("UserRole", user.Role);
                HttpContext.Session.SetString("Username", user.Username);

                // Kiểm tra nếu người dùng là admin và chuyển hướng đến newfeedadmin
                if (user.Email == "admin@example.com")
                {
                    // Điều hướng đến trang newfeedadmin
                    return RedirectToAction("NewFeedAdmin", "Home");
                }

                // Nếu không phải admin, điều hướng đến trang newfeed
                return RedirectToAction("NewFeed", "Home");
            }

            // Đăng nhập thất bại
            ViewBag.Error = "Invalid email or password.";
            return View();
        }
        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            return RedirectToAction("Login");
        }

        public IActionResult Register()
        {
            return RedirectToAction("Login", new { register = "true" });
        }
        public IActionResult Manage()
        {
            // Lấy số lượng bài hát từ cơ sở dữ liệu
            var songCount = _context.Songs.Count();

            // Truyền số lượng bài hát vào View
            ViewData["SongCount"] = songCount;

            return View();
        }
        [HttpPost]
        public IActionResult Register(string name, string email, string password)
        {
            if (_context.Users.Any(u => u.Email == email))
            {
                ViewBag.RegisterError = "Email already exists.";
                return View("Login");
            }

            // Đảm bảo Bio có giá trị, có thể là chuỗi rỗng nếu không có thông tin
            var newUser = new User
            {
                Username = name,
                Email = email,
                Password = password,
                Role = "User",
                Bio = ""  // Giá trị mặc định cho Bio nếu không có thông tin
            };

            _context.Users.Add(newUser);
            _context.SaveChanges();

            return RedirectToAction("Login");
        }
    }

}
