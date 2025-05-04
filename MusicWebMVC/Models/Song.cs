using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace MusicWebMVC.Models
{
    public class Song
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Title { get; set; }

        [ForeignKey("User")]
        public int ArtistId { get; set; }

        public int PostId { get; set; }

        public string? FileUrl { get; set; }
        public string? CoverImage { get; set; }
        public string? Lyrics { get; set; }
        public string? Genre { get; set; }
        public string? Era { get; set; }
        public string? Type { get; set; }
        public DateTime UploadDate { get; set; } = DateTime.Now;
        public string Status { get; set; }
        public string? YouTubeUrl { get; set; }
        public string? YouTubeVideoId { get; set; }
        public virtual User User { get; set; }
        public virtual Post Post { get; set; }
        public virtual ICollection<Like> Likes { get; set; }
        public virtual ICollection<Dislike> Dislikes { get; set; }
        public virtual ICollection<Comment> Comments { get; set; }

        // Mối quan hệ nhiều-nhiều với Playlist thông qua PlaylistSong
        public virtual ICollection<PlaylistSong> PlaylistSongs { get; set; } = new List<PlaylistSong>();
        public virtual ICollection<RecentPlay> RecentPlays { get; set; } = new List<RecentPlay>();
    }
}
