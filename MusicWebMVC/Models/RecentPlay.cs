
// Model cho Recent Plays
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MusicWebMVC.Models
{
    public class RecentPlay
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("User")]
        public int UserId { get; set; }

        [ForeignKey("Song")]
        public int SongId { get; set; }

        public DateTime PlayedAt { get; set; } = DateTime.Now;

        public virtual User User { get; set; }
        public virtual Song Song { get; set; }
    }
}