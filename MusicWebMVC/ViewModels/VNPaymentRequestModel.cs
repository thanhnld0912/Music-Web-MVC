namespace MusicWebMVC.ViewModels
{
    public class VNPaymentRequestModel
    {
        public int UserID { get; set; }
        public string FullName { get; set; }
        public string Description { get; set; }
        public double Amount { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}
