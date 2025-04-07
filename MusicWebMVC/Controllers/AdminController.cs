using Microsoft.AspNetCore.Mvc;

namespace MusicWebMVC.Controllers
{
    public class AdminController : Controller
    {
        public IActionResult NewFeedAdmin()
        {
            return View();
        }
        public IActionResult Manage()
        {
            return View();
        }
    }
}
