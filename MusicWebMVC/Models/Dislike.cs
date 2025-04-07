using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MusicWebMVC.Models
{
    public class Dislike
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey("User")]
        public int UserId { get; set; }

        [ForeignKey("Post")]
        public int? PostId { get; set; } // Like bài đăng
        public int? SongId { get; set; } // Like bài đăng

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual User User { get; set; }
        public virtual Song Song { get; set; }
        public virtual Post? Post { get; set; }
    }
}
