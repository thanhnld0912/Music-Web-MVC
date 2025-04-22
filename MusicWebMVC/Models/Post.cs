using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;
namespace MusicWebMVC.Models
{
    public class Post
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("User")]
        public int UserId { get; set; }

        [Required]
        public string Content { get; set; }

        public string? ImageUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        public String? LinkYoutube { get; set; }

        public virtual User User { get; set; }

        [ForeignKey("Song")]
        public int? SongId { get; set; }
        public virtual Song? Song { get; set; }
        public virtual ICollection<Like> Likes { get; set; }
        public virtual ICollection<Dislike> Dislikes { get; set; }
        public virtual ICollection<Comment> Comments { get; set; }
        public virtual ICollection<PostReport> PostReports { get; set; }
    }
}
