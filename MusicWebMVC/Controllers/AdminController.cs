using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MusicWeb.Models;
using MusicWebMVC.Data;
using MusicWebMVC.Models;

namespace MusicWebMVC.Controllers
{
    public class AdminController : Controller
    {
        private readonly ApplicationDbContext _context;

        public AdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        public IActionResult Dashboard()
        {
            return View();
        }

        //public IActionResult User()
        //{
        //    return View();
        //}

        public IActionResult Post()
        {
            return View();
        }

        public IActionResult Cover()
        {
            return View();
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
                    IsDisabled = u.IsDisabled
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

            return View(result);
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
    }
}
