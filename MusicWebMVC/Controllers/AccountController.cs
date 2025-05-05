using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MusicWebMVC.Data;
using MusicWebMVC.Models;
using System.Security.Claims;
using MusicWebMVC.Services;
using MusicWebMVC.ViewModels;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;


namespace MusicWebMVC.Controllers
{
    public class AccountController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IWebHostEnvironment _env;
        public AccountController(ApplicationDbContext context, IEmailService emailService, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
            _emailService = emailService;
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

        [HttpGet]
        public IActionResult Register()
        {
            return RedirectToAction("NewFeed", "Home", new { register = "true" });
        }
        public IActionResult Manage()
        {
            // Lấy số lượng bài hát từ cơ sở dữ liệu
            var songCount = _context.Songs.Count();

            // Truyền số lượng bài hát vào View
            ViewData["SongCount"] = songCount;

            return View();
        }

        //------------Register--------------------
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Register(RegisterViewModel model)
        {
            if (ModelState.IsValid)
            {
                // Check if email already exists
                if (await _context.Users.AnyAsync(u => u.Email == model.Email))
                {
                    ViewBag.RegisterError = "Email này đã được sử dụng. Vui lòng dùng email khác.";
                    return View("Login", model);
                }

                // Check if username already exists
                if (await _context.Users.AnyAsync(u => u.Username == model.Username))
                {
                    ModelState.AddModelError("Username", "Username already taken");
                    return View("Login", model);
                }

                // Create new user
                var user = new User
                {
                    Username = model.Username,
                    Email = model.Email,
                    Password = model.Password,
                    Role = "User",
                    CreatedAt = DateTime.Now,
                    EmailConfirmed = false,
                    EmailConfirmationToken = GenerateToken(),
                    EmailConfirmationTokenExpiry = DateTime.Now.AddDays(1),
                    Bio = ""
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Send confirmation email
                var confirmationLink = Url.Action("ConfirmEmail", "Account",
                    new { userId = user.Id, token = user.EmailConfirmationToken },
                    protocol: HttpContext.Request.Scheme);

                var message = $@"
                    <h2>Confirm your email address</h2>
                    <p>Thank you for registering with MusicWeb. Please confirm your email by clicking the link below:</p>
                    <a href='{confirmationLink}'>Confirm Email</a>
                    <p>This link will expire in 24 hours.</p>";

                await _emailService.SendEmailAsync(user.Email, "Confirm your email - MusicWeb", message);

                return RedirectToAction("RegisterConfirmation");
            }

            return View("Login", model);
        }

        public IActionResult RegisterConfirmation()
        {
            return View();
        }


        [HttpGet]
        public async Task<IActionResult> ConfirmEmail(int userId, string token)
        {
            if (userId <= 0 || string.IsNullOrEmpty(token))
            {
                return BadRequest("Invalid email confirmation link");
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            if (user.EmailConfirmed)
            {
                // Nếu email đã được xác nhận trước đó, cũng tự động đăng nhập người dùng
                await SignInUserAfterConfirmation(user);
                return RedirectToAction("NewFeed", "Home");
            }

            if (user.EmailConfirmationToken != token)
            {
                return BadRequest("Invalid token");
            }

            if (user.EmailConfirmationTokenExpiry < DateTime.Now)
            {
                return RedirectToAction("TokenExpired", new { userId = user.Id });
            }

            user.EmailConfirmed = true;
            user.EmailConfirmationToken = null;
            user.EmailConfirmationTokenExpiry = null;

            await _context.SaveChangesAsync();

            // Tự động đăng nhập người dùng sau khi xác nhận email thành công
            await SignInUserAfterConfirmation(user);

            return RedirectToAction("NewFeed", "Home");
        }

        // Phương thức  để đăng nhập người dùng sau khi xác nhận email
        private async Task SignInUserAfterConfirmation(User user)
        {
            // Tạo danh sách các claims để lưu thông tin người dùng
            var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Name, user.Username),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim(ClaimTypes.Role, user.Role)
    };

            // Tạo identity từ claims
            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var principal = new ClaimsPrincipal(identity);

            // Thiết lập thuộc tính xác thực
            var authProperties = new AuthenticationProperties
            {
                IsPersistent = true, // Lưu cookie đăng nhập (Remember me)
                ExpiresUtc = DateTimeOffset.UtcNow.AddDays(30) // Cookie có hiệu lực trong 30 ngày
            };

            // Đăng nhập người dùng
            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                principal,
                authProperties);

            // Lưu thông tin người dùng vào session để dễ dàng truy cập
            HttpContext.Session.SetString("UserInfo", JsonSerializer.Serialize(new
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
               
            }));

            HttpContext.Session.SetString("UserId", user.Id.ToString());
            HttpContext.Session.SetString("Username", user.Username);
            HttpContext.Session.SetString("AvatarUrl", "/img/avatar.jpg");
            HttpContext.Session.SetString("Role", user.Role);
        }



        [HttpGet]
        public IActionResult TokenExpired(int userId)
        {
            ViewBag.UserId = userId;
            return View();
        }




        private string GenerateToken()
        {
            // Generate a random token
            var tokenBytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(tokenBytes);
            }
            return Convert.ToBase64String(tokenBytes);
        }



        // ------------Register>

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
                    Bio = "",
                    level = "Bronze"
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
            HttpContext.Session.SetString("AvatarUrl", "/img/avatar.jpg");
            HttpContext.Session.SetString("Role", user.Role);
        }



        //---------------------------Forgot password
        [HttpGet]
        public IActionResult ForgotPassword()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordViewModel model)
        {
            if (ModelState.IsValid)
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);
                if (user == null)
                {
                    // Không tiết lộ rằng email không tồn tại vì lý do bảo mật
                    return RedirectToAction("ForgotPasswordConfirmation");
                }

                // Sử dụng phương thức GenerateToken() đã có sẵn
                var token = GenerateToken();
                user.PasswordResetToken = token;
                user.PasswordResetTokenExpiry = DateTime.Now.AddHours(24);

                await _context.SaveChangesAsync();

                // Gửi email với link reset password
                var resetLink = Url.Action("ResetPassword", "Account",
                    new { email = user.Email, token = token },
                    protocol: HttpContext.Request.Scheme);

                var message = $@"
            <h2>Đặt lại mật khẩu</h2>
            <p>Để đặt lại mật khẩu của bạn, vui lòng nhấp vào liên kết dưới đây:</p>
            <a href='{resetLink}'>Đặt lại mật khẩu</a>
            <p>Liên kết này sẽ hết hạn sau 24 giờ.</p>";

                await _emailService.SendEmailAsync(user.Email, "Đặt lại mật khẩu - MusicWeb", message);

                return RedirectToAction("ForgotPasswordConfirmation");
            }

            return View(model);
        }

        public IActionResult ForgotPasswordConfirmation()
        {
            return View();
        }

        [HttpGet]
        public IActionResult ResetPassword(string email, string token)
        {
            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(token))
            {
                return BadRequest("Email hoặc token không hợp lệ");
            }

            var model = new ResetPasswordViewModel
            {
                Email = email,
                Token = token
            };

            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ResetPassword(ResetPasswordViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);
            if (user == null)
            {
                // Không tiết lộ rằng người dùng không tồn tại
                return RedirectToAction("ResetPasswordConfirmation");
            }

            // Kiểm tra token hợp lệ và chưa hết hạn
            if (user.PasswordResetToken != model.Token ||
                user.PasswordResetTokenExpiry == null ||
                user.PasswordResetTokenExpiry < DateTime.Now)
            {
                ModelState.AddModelError("", "Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
                return View(model);
            }

            // Cập nhật mật khẩu
            user.Password = model.Password; // Trong thực tế, bạn cần hash mật khẩu trước khi lưu
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpiry = null;

            await _context.SaveChangesAsync();

            return RedirectToAction("ResetPasswordConfirmation");
        }

        public IActionResult ResetPasswordConfirmation()
        {
            return View();
        }

    }
}

