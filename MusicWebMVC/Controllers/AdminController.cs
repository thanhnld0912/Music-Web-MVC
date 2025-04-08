using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MusicWeb.Models;
using MusicWebMVC.Data;

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

        public IActionResult User()
        {
            var users = _context.Users
                .Where(u => u.Role == "User")
                .Select(u => new UserViewModel
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    PostCount = u.Posts.Count()
                })
                .ToList();

            return View(users);
        }
    }
}
