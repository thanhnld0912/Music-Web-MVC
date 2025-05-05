using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
namespace MusicWebMVC.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Username { get; set; }

        [Required, EmailAddress]
        public string Email { get; set; }

        [Required, DataType(DataType.Password)]
        public string Password { get; set; }

        public string Role { get; set; } // Listener, Uploader, VIP




        public string AvatarUrl { get; set; } = "/img/default-avatar.png";
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [StringLength(500)]
        public string Bio { get; set; }

        public bool IsDisabled { get; set; } = false;

        public bool IsVIP { get; set; } = false;

        public DateTime LastActivity { get; set; }
        public bool IsActive { get; set; }
        public string level { get; set; } = "Bronze"; // Bronze, Silver, Gold, Diamond 

        public bool EmailConfirmed { get; set; } = false;
        public string? EmailConfirmationToken { get; set; }
        public DateTime? EmailConfirmationTokenExpiry { get; set; }


        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiry { get; set; }

        public virtual ICollection<Song> Songs { get; set; }
        public virtual ICollection<Post> Posts { get; set; }
        public virtual ICollection<Like> Likes { get; set; }
        public virtual ICollection<Comment> Comments { get; set; }

        public virtual ICollection<Follow> Following { get; set; }
        public virtual ICollection<Playlist> Playlists { get; set; }

        public virtual ICollection<Follow> Followers { get; set; }
        public virtual ICollection<Notification> Notifications { get; set; }

        public virtual ICollection<CommentReport> CommentReports { get; set; }
        public virtual ICollection<PostReport> PostReports { get; set; }
        public virtual ICollection<RecentPlay> RecentPlays { get; set; } = new List<RecentPlay>();
    }
}
