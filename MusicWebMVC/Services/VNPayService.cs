using MusicWebMVC.Helpers;
using MusicWebMVC.ViewModels;

namespace MusicWebMVC.Services
{
    public class VNPayService : IVNPayService
    {
        private readonly IConfiguration _config;

        public VNPayService(IConfiguration config)
        {
            _config = config;
        }

        public string CreatePaymentUrl(HttpContext context, VNPaymentRequestModel model)
        {
            var tick = DateTime.Now.Ticks.ToString();

            //var uniqueRef = $"{model.UserID}_{DateTime.UtcNow:yyyyMMddHHmmssfff}_{Guid.NewGuid().ToString("N").Substring(0, 6)}";

            var vnpay = new VNPayLibrary();
            vnpay.AddRequestData("vnp_Version", _config["VNPay:Version"]);
            vnpay.AddRequestData("vnp_Command", _config["VNPay:Command"]);
            vnpay.AddRequestData("vnp_TmnCode", _config["VNPay:TmnCode"]);
            vnpay.AddRequestData("vnp_Amount", (model.Amount * 100).ToString());
            vnpay.AddRequestData("vnp_CreateDate", model.CreatedDate.ToString("yyyyMMddHHmmss"));
            vnpay.AddRequestData("vnp_CurrCode", _config["VNPay:CurrCode"]);
            vnpay.AddRequestData("vnp_IpAddr", Utils.GetIpAddress(context));
            Console.WriteLine("IP dc gui toi vnpay: " + Utils.GetIpAddress(context));
            vnpay.AddRequestData("vnp_Locale", _config["VNPay:Locale"]);
            //vnpay.AddRequestData("vnp_UserInfo", "thanh toan cho khach hang: " + model.UserID);
            vnpay.AddRequestData("vnp_OrderInfo", $"UserID:{model.UserID}");
            vnpay.AddRequestData("vnp_OrderType", "other"); // hoặc "billpayment", "fashion", tùy loại dịch vụ
            vnpay.AddRequestData("vnp_ReturnUrl", _config["VNPay:PaymentBackReturnUrl"]);
            //vnpay.AddRequestData("vnp_SecureHashType", "HMACSHA512");
            //vnpay.AddRequestData("vnp_TxnRef", uniqueRef);
            //Console.WriteLine("Generated vnp_TxnRef: " + uniqueRef);
            vnpay.AddRequestData("vnp_TxnRef", tick);
            Console.Write(tick);

            var paymentUrl = vnpay.CreateRequestUrl(_config["VNPay:BaseUrl"], _config["VNPay:HashSecret"]);

            Console.WriteLine("VNPay payment URL: " + paymentUrl);
            return paymentUrl;
        }

        public VNPaymentResponseModel PaymentExecute(IQueryCollection collection)
        {
            var vnpay = new VNPayLibrary();
            foreach (var (key, value) in collection)
            {
                if (!string.IsNullOrEmpty(key) && key.StartsWith("vnp_"))
                {
                    vnpay.AddResponseData(key, value.ToString());
                }
            }

            var vnp_OrderId = Convert.ToInt64(vnpay.GetResponseData("vnp_TxnRef"));
            var vnp_TransactionId = Convert.ToInt64(vnpay.GetResponseData("vnp_TransactionNo"));
            var vnp_SecureHash = collection.FirstOrDefault(p => p.Key == "vnp_SecureHash").Value;
            var vnp_ResponseCode = vnpay.GetResponseData("vnp_ResponseCode");
            var vnp_OrderInfo = vnpay.GetResponseData("vnp_OrderInfo");

            bool checkSignature = vnpay.ValidateSignature(vnp_SecureHash, _config["VNPay:HashSecret"]);

            if (!checkSignature)
            {
                return new VNPaymentResponseModel()
                {
                    Success = false
                };
            }

            return new VNPaymentResponseModel()
            {
                Success = true,
                PaymentMethod = "VNPay",
                OrderDescription = vnp_OrderInfo,
                OrderId = vnp_OrderId.ToString(),
                TransactionId = vnp_TransactionId.ToString(),
                Token = vnp_SecureHash,
                VnPayResponseCode = vnp_ResponseCode
            };
        }
        //public VNPaymentResponseModel PaymentExecute(IQueryCollection collection)
        //{
        //    var vnpay = new VNPayLibrary();

        //    foreach (var (key, value) in collection)
        //    {
        //        if (!string.IsNullOrEmpty(key) && key.StartsWith("vnp_"))
        //        {
        //            vnpay.AddResponseData(key, value.ToString());
        //        }
        //    }

        //    try
        //    {
        //        // Validate txnRefStr and txnNoStr parsing once
        //        string txnRefStr = vnpay.GetResponseData("vnp_TxnRef");
        //        string txnNoStr = vnpay.GetResponseData("vnp_TransactionNo");

        //        if (string.IsNullOrEmpty(txnRefStr) || string.IsNullOrEmpty(txnNoStr))
        //        {
        //            Console.WriteLine("Missing txnRef or txnNo");
        //            return new VNPaymentResponseModel { Success = false };
        //        }

        //        var parts = txnRefStr.Split('_');
        //        if (parts.Length != 2 || !long.TryParse(parts[0], out long vnp_UserId) || !long.TryParse(txnNoStr, out long vnp_TransactionId))
        //        {
        //            return new VNPaymentResponseModel { Success = false };
        //        }

        //        // SecureHash Validation
        //        var vnp_SecureHash = collection["vnp_SecureHash"].ToString();
        //        if (string.IsNullOrEmpty(vnp_SecureHash))
        //        {
        //            Console.WriteLine("Missing SecureHash");
        //            return new VNPaymentResponseModel { Success = false };
        //        }

        //        var checkSignature = vnpay.ValidateSignature(vnp_SecureHash, _config["VNPay:HashSecret"]);
        //        if (!checkSignature)
        //        {
        //            return new VNPaymentResponseModel { Success = false };
        //        }

        //        return new VNPaymentResponseModel
        //        {
        //            Success = true,
        //            PaymentMethod = "VNPay",
        //            OrderDescription = vnpay.GetResponseData("vnp_OrderInfo"),
        //            OrderId = vnp_UserId.ToString(),
        //            TransactionId = vnp_TransactionId.ToString(),
        //            Token = vnp_SecureHash
        //        };
        //    }
        //    catch (Exception ex)
        //    {
        //        // Use logging framework
        //        Console.WriteLine("VNPAY Exception: " + ex.Message);
        //        return new VNPaymentResponseModel { Success = false };
        //    }
        //}
    }
}
