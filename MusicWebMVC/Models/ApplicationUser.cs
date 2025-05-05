using Microsoft.AspNetCore.Identity;

namespace MusicWebMVC.Models
    
{
    public class ApplicationUser : IdentityUser
    {
        public bool EmailConfirmed { get; set; }
        public string EmailConfirmationToken { get; set; }
    }
}
