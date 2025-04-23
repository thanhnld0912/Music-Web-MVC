using Azure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MusicWebMVC.Data;
using MusicWebMVC.Services;
using MusicWebMVC.ViewModels;
using System.Threading.Tasks;

namespace MusicWebMVC.Controllers
{
    public class PaymentController : Controller
    {
        private readonly IVNPayService _vnPayService;
        private readonly ApplicationDbContext _context;

        public PaymentController(IVNPayService vnPayService, ApplicationDbContext context)
        {
            _vnPayService = vnPayService;
            _context = context;
        }

        //[Authorize]
        [HttpPost]
        public IActionResult Checkout(CheckoutViewModel model)
        {
            var vnPayModel = new VNPaymentRequestModel
            {
                Amount = model.Amount,
                CreatedDate = DateTime.Now,
                Description = $"{model.FullName}_abc",
                FullName = model.FullName,
                UserID = model.UserID
            };

            return Redirect(_vnPayService.CreatePaymentUrl(HttpContext, vnPayModel));
        }

        //[Authorize]
        public IActionResult PaymentFail()
        {
            return RedirectToAction("Payment", "Payment");
        }

        //[Authorize]
        public async Task<IActionResult> PaymentCallBackAsync()
        {
            var response = _vnPayService.PaymentExecute(Request.Query);

            if (response == null || response.VnPayResponseCode != "00")
            {
                TempData["Message"] = $"Error VNPay: {response.VnPayResponseCode}";
                return RedirectToAction("PaymentFail");
            }

            var orderInfo = response.OrderDescription;
            int userID = 0;
            if (orderInfo != null && orderInfo.Contains("UserID:"))
            {
                var parts = orderInfo.Split("UserID:");
                if (parts.Length > 1 && int.TryParse(parts[1], out int parsedId))
                {
                    userID = parsedId;
                }
            }

            if (userID > 0)
            {
                var user = await _context.Users.FindAsync(userID);
                if (user != null)
                {
                    user.IsVIP = true;
                    await _context.SaveChangesAsync();
                }
            }

            TempData["Message"] = "Success VNPay";
            return RedirectToAction("Profile", "Account");
        }

        public IActionResult Payment()
        {
            return View();
        }
    }
}
