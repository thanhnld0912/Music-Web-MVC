using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;
namespace MusicWebMVC.Models
{
    // Model cho việc chỉnh sửa bài đăng
    public class PostEditModel
    {
        public int UserId { get; set; }
        public string Content { get; set; }
        public string ImageUrl { get; set; }
    }
}
