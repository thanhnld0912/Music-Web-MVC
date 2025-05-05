using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MusicWebMVC.Data;
using MusicWebMVC.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Hosting;

namespace MusicWebMVC.Controllers
{
    public class AccountController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public AccountController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
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
        public async Task<IActionResult> UpdateProfile()
        {
            try
            {
                // Get user ID from session
                var userId = HttpContext.Session.GetString("UserId");
                if (string.IsNullOrEmpty(userId))
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                // Find the user in database
                var user = _context.Users.FirstOrDefault(u => u.Id.ToString() == userId);
                if (user == null)
                {
                    return Json(new { success = false, message = "User not found" });
                }

                // Get form data
                var username = Request.Form["Username"].ToString();
                var email = Request.Form["Email"].ToString();
                var bio = Request.Form["Bio"].ToString();

                // Validate required fields
                if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(email))
                {
                    return Json(new { success = false, message = "Username and email are required" });
                }

                // Update user information
                user.Username = username;
                user.Email = email;
                user.Bio = bio;

                // Update password if provided
                var password = Request.Form["Password"].ToString();
                if (!string.IsNullOrEmpty(password))
                {
                    user.Password = password;
                }

                // Handle profile image upload
                var profileImage = Request.Form.Files.GetFile("ProfileImage");
                if (profileImage != null && profileImage.Length > 0)
                {
                    // Create uploads directory if it doesn't exist
                    var uploadsDir = Path.Combine(_env.WebRootPath, "uploadsImage");
                    if (!Directory.Exists(uploadsDir))
                    {
                        Directory.CreateDirectory(uploadsDir);
                    }

                    // Generate unique filename
                    var fileName = $"{Guid.NewGuid()}_{profileImage.FileName}";
                    var filePath = Path.Combine(uploadsDir, fileName);

                    // Save file
                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        await profileImage.CopyToAsync(fileStream);
                    }

                    // Update user's avatar URL
                    user.AvatarUrl = $"/uploadsImage/{fileName}";

                    // Update session
                    HttpContext.Session.SetString("AvatarUrl", user.AvatarUrl);
                }

                // Save changes
                await _context.SaveChangesAsync();

                // Update session
                HttpContext.Session.SetString("Username", user.Username);
                HttpContext.Session.SetString("Email", user.Email);

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error updating profile: {ex.Message}" });
            }
        }
        public IActionResult Login()
        {
            return View();
        }

        public IActionResult Loader()
        {
            return View();
        }

        //[HttpPost]
        //public IActionResult Login(string email, string password)
        //{
        //    var user = _context.Users.FirstOrDefault(u => u.Email == email && u.Password == password);

        //    if (user != null)
        //    {
        //        // Lưu thông tin người dùng vào session
        //        HttpContext.Session.SetString("UserId", user.Id.ToString());
        //        HttpContext.Session.SetString("UserRole", user.Role);
        //        HttpContext.Session.SetString("Username", user.Username);
        //        HttpContext.Session.SetString("AvatarUrl", user.AvatarUrl);

        //        // Kiểm tra nếu người dùng là admin và chuyển hướng đến newfeedadmin
        //        if (user.Email == "admin@example.com")
        //        {
        //            // Điều hướng đến trang newfeedadmin
        //            return RedirectToAction("NewFeedAdmin", "Home");
        //        }

        //        // Nếu không phải admin, điều hướng đến trang newfeed
        //        return RedirectToAction("NewFeed", "Home");
        //    }

        //    // Đăng nhập thất bại
        //    ViewBag.Error = "Invalid email or password.";
        //    return View();
        //}
        [HttpPost]
        public IActionResult Login(string email, string password)
        {
            var user = _context.Users.FirstOrDefault(u => u.Email == email && u.Password == password);

            if (user == null)
            {
                ViewBag.Error = "Invalid email or password.";
                return View();
            }

            if (user.IsDisabled)
            {
                ViewBag.Error = "Tài khoản của bạn đã bị vô hiệu hóa.";
                return View();
            }

            // Lưu thông tin người dùng vào session
            HttpContext.Session.SetString("UserId", user.Id.ToString());
            HttpContext.Session.SetString("UserRole", user.Role);
            HttpContext.Session.SetString("Username", user.Username);
            HttpContext.Session.SetString("AvatarUrl", user.AvatarUrl);

            // Kiểm tra nếu người dùng là admin
            if (user.Email == "admin@example.com")
            {
                return RedirectToAction("NewFeedAdmin", "Home");
            }

            return RedirectToAction("NewFeed", "Home");
        }

        public IActionResult Logout()
        {
            var userIdStr = HttpContext.Session.GetString("UserId");

            if (!string.IsNullOrEmpty(userIdStr) && int.TryParse(userIdStr, out int userId))
            {
                var user = _context.Users.FirstOrDefault(u => u.Id == userId);
                if (user != null)
                {
                    user.IsActive = false;
                    user.LastActivity = DateTime.UtcNow;
                    _context.SaveChanges();
                }
            }

            HttpContext.Session.Clear();
            return RedirectToAction("Login", "Account");
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
                Bio = "",
                AvatarUrl = "/img/avatar.jpg"
            };

            _context.Users.Add(newUser);
            _context.SaveChanges();

            return RedirectToAction("Login");
        }


        public async Task LoginByGoogle()
        {
            await HttpContext.ChallengeAsync(GoogleDefaults.AuthenticationScheme, new AuthenticationProperties
            {
                RedirectUri = Url.Action("GoogleResponse")
            });
        }

        public async Task<IActionResult> GoogleResponse()
        {
            // Lấy kết quả xác thực
            var result = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            if (!result.Succeeded)
            {
                TempData["Error"] = "Không thể đăng nhập bằng Google. Vui lòng thử lại.";
                return RedirectToAction("Login");
            }

            // Lấy thông tin từ claims
            var claims = result.Principal.Identities.FirstOrDefault()?.Claims.ToList();

            // Trích xuất email và tên
            var email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
            var name = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;

            if (string.IsNullOrEmpty(email))
            {
                TempData["Error"] = "Không thể lấy thông tin email từ tài khoản Google.";
                return RedirectToAction("Login");
            }

            // Kiểm tra xem user đã tồn tại chưa
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (existingUser == null)
            {
                // Tạo user mới nếu chưa tồn tại
                var newUser = new User
                {
                    Email = email,
                    Username = name ?? email.Split('@')[0], // Dùng tên hoặc phần đầu của email làm username
                    Password = Convert.ToBase64String(Guid.NewGuid().ToByteArray()), // Password ngẫu nhiên
                    Role = "User", // Role mặc định
                    CreatedAt = DateTime.Now,
                    Bio = ""
                };

                try
                {
                    _context.Users.Add(newUser);
                    await _context.SaveChangesAsync();

                    // Đăng nhập với user vừa tạo
                    await SignInUser(newUser);

                    return RedirectToAction("NewFeed", "Home");
                }
                catch (Exception ex)
                {
                    // Log lỗi
                    TempData["Error"] = "Không thể lưu thông tin người dùng. Lỗi: " + ex.Message;
                    return RedirectToAction("Login");
                }
            }
            else
            {
                // Đăng nhập với user đã tồn tại
                await SignInUser(existingUser);
                return RedirectToAction("NewFeed", "Home");
            }
        }

        // Phương thức helper để đăng nhập user
        private async Task SignInUser(User user)
        {
            var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };

            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var principal = new ClaimsPrincipal(identity);

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                principal,
                new AuthenticationProperties
                {
                    IsPersistent = true,
                    ExpiresUtc = DateTime.UtcNow.AddDays(30)
                }
            );
            HttpContext.Session.SetString("UserId", user.Id.ToString());
            HttpContext.Session.SetString("Username", user.Username);
            HttpContext.Session.SetString("AvatarUrl",  "/img/avatar.jpg");
            HttpContext.Session.SetString("Role", user.Role);
        }
    }
}
