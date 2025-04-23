using MusicWebMVC.ViewModels;

namespace MusicWebMVC.Services
{
    public interface IVNPayService
    {
        string CreatePaymentUrl(HttpContext context, VNPaymentRequestModel model);
        VNPaymentResponseModel PaymentExecute(IQueryCollection collection);
    }
}
