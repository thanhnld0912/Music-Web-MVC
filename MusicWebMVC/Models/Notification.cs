using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MusicWebMVC.Models
{
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        public string Message { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public bool IsRead { get; set; } = false;

        // Người nhận
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; }

        // Người tạo hành động
        public int? FromUserId { get; set; }

        [ForeignKey("FromUserId")]
        public virtual User FromUser { get; set; }

        // Gắn link tới bài đăng/bài hát
        public int? PostId { get; set; }
        public int? SongId { get; set; }

        public string? Url { get; set; }
        public string? Type { get; set; } // "Like", "Comment", "Follow", etc.
    }
}
