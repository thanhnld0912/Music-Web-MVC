using MusicWebMVC.Models;

namespace MusicWebMVC.ViewModels
{
    public class NewFeedViewModel
    {
        public User User { get; set; }
        public List<Post> Posts { get; set; }
    }
}
