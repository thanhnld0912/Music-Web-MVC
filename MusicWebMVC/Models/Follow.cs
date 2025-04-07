using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace MusicWebMVC.Models
{
    public class Follow
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int FollowerId { get; set; } // Người theo dõi

        [Required]
        public int FollowingId { get; set; } // Người được theo dõi

        public DateTime FollowedAt { get; set; } = DateTime.Now;

        [ForeignKey("FollowerId")]
        public virtual User Follower { get; set; }

        [ForeignKey("FollowingId")]
        public virtual User Following { get; set; }
    }
}
