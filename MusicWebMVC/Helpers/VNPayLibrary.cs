using System.Globalization;
using System.Net.Sockets;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using MusicWebMVC.ViewModels;

namespace MusicWebMVC.Helpers
{
    public class VNPayLibrary
    {
        private readonly SortedList<string, string> _requestData = new SortedList<string, string>(new VnPayCompare());
        private readonly SortedList<string, string> _responseData = new SortedList<string, string>(new VnPayCompare());

        public void AddRequestData(string key, string value)
        {
            if (!string.IsNullOrEmpty(value))
            {
                _requestData.Add(key, value);
            }
        }

        public void AddResponseData(string key, string value)
        {
            if (!string.IsNullOrEmpty(value))
            {
                _responseData.Add(key, value);
            }
        }

        public string GetResponseData(string key)
        {
            return _responseData.TryGetValue(key, out var retValue) ? retValue : string.Empty;
        }

        #region Request
        public string CreateRequestUrl(string baseUrl, string vnpHashSecret)
        {
            var data = new StringBuilder();

            foreach (var (key, value) in _requestData.Where(kv => !string.IsNullOrEmpty(kv.Value)))
            {
                data.Append(WebUtility.UrlEncode(key) + "=" + WebUtility.UrlEncode(value) + "&");
            }

            var querystring = data.ToString();

            baseUrl += "?" + querystring;
            var signData = querystring;
            if (signData.Length > 0)
            {
                signData = signData.Remove(data.Length - 1, 1);
            }

            var vnpSecureHash = Utils.HmacSHA512(vnpHashSecret, signData);
            baseUrl += "vnp_SecureHash=" + vnpSecureHash;

            return baseUrl;
        }
        //public string CreateRequestUrl(string baseUrl, string vnpHashSecret)
        //{
        //    var data = new StringBuilder();     // Đã UrlEncode để đưa lên URL
        //    var rawData = new StringBuilder();  // Không encode, dùng để ký

        //    foreach (var (key, value) in _requestData.OrderBy(kv => kv.Key)) // đảm bảo thứ tự
        //    {
        //        if (!string.IsNullOrEmpty(value))
        //        {
        //            data.Append(WebUtility.UrlEncode(key) + "=" + WebUtility.UrlEncode(value) + "&");

        //            // BỎ QUA 2 TRƯỜNG NÀY khi tạo rawData
        //            if (key != "vnp_SecureHash" && key != "vnp_SecureHashType")
        //            {
        //                rawData.Append(key + "=" + value + "&");
        //            }
        //        }
        //    }

        //    // Xoá dấu & cuối cùng
        //    if (data.Length > 0) data.Length -= 1;
        //    if (rawData.Length > 0) rawData.Length -= 1;

        //    // Tính hash
        //    var vnpSecureHash = Utils.HmacSHA512(vnpHashSecret, rawData.ToString());

        //    // Gắn vnp_SecureHash và vnp_SecureHashType vào URL cuối
        //    string paymentUrl = $"{baseUrl}?{data}&vnp_SecureHash={vnpSecureHash}&vnp_SecureHashType=HMACSHA512";
        //    Console.WriteLine("🔍 RawData for hash: " + rawData.ToString());
        //    Console.WriteLine("✅ Hash result: " + vnpSecureHash);
        //    Console.WriteLine("🌐 Full URL: " + paymentUrl);

        //    return paymentUrl;
        //}

        //    public string CreateRequestUrl(VNPaymentResquestModel model, string baseUrl, string hashSecret)
        //    {
        //        var vnpayData = new SortedDictionary<string, string>
        //{
        //    { "vnp_Version", "2.1.0" },
        //    { "vnp_Command", "pay" },
        //    { "vnp_TmnCode", model.TmnCode },
        //    { "vnp_Amount", (model.Amount * 100).ToString() },
        //    { "vnp_CurrCode", "VND" },
        //    { "vnp_TxnRef", model.TxnRef },
        //    { "vnp_OrderInfo", model.OrderInfo },
        //    { "vnp_OrderType", "other" },
        //    { "vnp_Locale", "vn" },
        //    { "vnp_ReturnUrl", model.ReturnUrl }, // không encode ở bước sau
        //    { "vnp_IpAddr", model.IpAddress },
        //    { "vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss") }
        //};

        //        // 1. Tạo chuỗi rawData để hash
        //        var rawData = string.Join("&", vnpayData
        //            .Select(kvp => $"{kvp.Key}={kvp.Value}"));

        //        // 2. Hash chuỗi bằng HMAC SHA512
        //        string secureHash;
        //        using (var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(hashSecret)))
        //        {
        //            var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(rawData));
        //            secureHash = BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
        //        }

        //        // 3. Gắn secureHash vào query
        //        vnpayData.Add("vnp_SecureHash", secureHash);

        //        // 4. Encode các value để lên URL, TRỪ vnp_ReturnUrl
        //        var query = string.Join("&", vnpayData.Select(kvp =>
        //        {
        //            if (kvp.Key == "vnp_ReturnUrl")
        //                return $"{kvp.Key}={kvp.Value}";
        //            else
        //                return $"{kvp.Key}={HttpUtility.UrlEncode(kvp.Value)}";
        //        }));

        //        var paymentUrl = baseUrl + "?" + query;

        //        Console.WriteLine("VNPay payment URL: " + paymentUrl);
        //        return paymentUrl;
        //    }
        #endregion

        #region Response process
        public bool ValidateSignature(string inputHash, string secretKey)
        {
            var rspRaw = GetResponseData();
            var myChecksum = Utils.HmacSHA512(secretKey, rspRaw);
            return myChecksum.Equals(inputHash, StringComparison.InvariantCultureIgnoreCase);
        }

        private string GetResponseData()
        {
            var data = new StringBuilder();
            if (_responseData.ContainsKey("vnp_SecureHashType"))
            {
                _responseData.Remove("vnp_SecureHashType");
            }

            if (_responseData.ContainsKey("vnp_SecureHash"))
            {
                _responseData.Remove("vnp_SecureHash");
            }

            foreach (var (key, value) in _responseData.Where(kv => !string.IsNullOrEmpty(kv.Value)))
            {
                data.Append(WebUtility.UrlEncode(key) + "=" + WebUtility.UrlEncode(value) + "&");
            }

            //remove last '&'
            if (data.Length > 0)
            {
                data.Remove(data.Length - 1, 1);
            }

            return data.ToString();
        }
        #endregion

    }

    public class Utils
    {
        public static string HmacSHA512(string key, string inputData)
        {
            var hash = new StringBuilder();
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var inputBytes = Encoding.UTF8.GetBytes(inputData);
            using (var hmac = new HMACSHA512(keyBytes))
            {
                var hashValue = hmac.ComputeHash(inputBytes);
                foreach (var theByte in hashValue)
                {
                    hash.Append(theByte.ToString("x2"));
                }
            }

            return hash.ToString();
        }


        public static string GetIpAddress(HttpContext context)
        {
            var ipAddress = string.Empty;
            try
            {
                var remoteIpAddress = context.Connection.RemoteIpAddress;

                if (remoteIpAddress != null)
                {
                    if (remoteIpAddress.AddressFamily == AddressFamily.InterNetworkV6)
                    {
                        remoteIpAddress = Dns.GetHostEntry(remoteIpAddress).AddressList
                            .FirstOrDefault(x => x.AddressFamily == AddressFamily.InterNetwork);
                    }

                    if (remoteIpAddress != null) ipAddress = remoteIpAddress.ToString();

                    return ipAddress;
                }
            }
            catch (Exception ex)
            {
                return "Invalid IP:" + ex.Message;
            }

            return "127.0.0.1";
        }
        //public static string GetIpAddress(HttpContext context)
        //{
        //    try
        //    {
        //        var ip = context.Connection.RemoteIpAddress;

        //        // Nếu là IPv6 thì chuyển về IPv4 (nếu có)
        //        if (ip != null && ip.IsIPv4MappedToIPv6)
        //        {
        //            ip = ip.MapToIPv4();
        //        }

        //        // Trả về IP string hoặc fallback
        //        return ip?.ToString() ?? "127.0.0.1";
        //    }
        //    catch
        //    {
        //        return "127.0.0.1";
        //    }
        //}
        //public static string GetIpAddress(HttpContext context)
        //{
        //    try
        //    {
        //        var ip = context.Connection.RemoteIpAddress;

        //        // Nếu là localhost (IPv6 loopback) hoặc null thì trả về 127.0.0.1
        //        if (ip == null || ip.ToString() == "::1")
        //        {
        //            return "127.0.0.1";
        //        }

        //        // Nếu IP là dạng IPv4 trong IPv6 thì chuyển lại
        //        if (ip.IsIPv4MappedToIPv6)
        //        {
        //            ip = ip.MapToIPv4();
        //        }

        //        return ip.ToString();
        //    }
        //    catch
        //    {
        //        return "127.0.0.1";
        //    }
        //}
    }

    public class VnPayCompare : IComparer<string>
    {
        public int Compare(string x, string y)
        {
            if (x == y) return 0;
            if (x == null) return -1;
            if (y == null) return 1;
            var vnpCompare = CompareInfo.GetCompareInfo("en-US");
            return vnpCompare.Compare(x, y, CompareOptions.Ordinal);
        }
    }
}    
