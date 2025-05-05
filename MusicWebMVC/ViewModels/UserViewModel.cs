namespace MusicWebMVC.ViewModels
{
    public class UserViewModel
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public int PostCount { get; set; }
        public bool? IsDisabled { get; set; }
        public bool? IsVIP { get; set; }
        public bool? IsActive { get; set; } 
        public DateTime LastActivity { get; set; }
    }
}
