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

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [StringLength(500)]
        public string Bio { get; set; }

        public bool IsDisabled { get; set; } = false;

        public virtual ICollection<Song> Songs { get; set; }
        public virtual ICollection<Post> Posts { get; set; }
        public virtual ICollection<Like> Likes { get; set; }
        public virtual ICollection<Comment> Comments { get; set; }

        public virtual ICollection<Follow> Following { get; set; }
        public virtual ICollection<Playlist> Playlists { get; set; }

        public virtual ICollection<Follow> Followers { get; set; }
    }
}
