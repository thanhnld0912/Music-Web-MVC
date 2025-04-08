using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MusicWebMVC.Data;
using MusicWebMVC.Models;
using System.Security.Claims;

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
