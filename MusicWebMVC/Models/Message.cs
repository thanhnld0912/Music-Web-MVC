using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MusicWebMVC.Models
{
    public class Message
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int SenderId { get; set; }

        [Required]
        public int ReceiverId { get; set; }

        [Required]
        [StringLength(2000)]
        public string Content { get; set; }

        public bool IsRead { get; set; } = false;

        public DateTime SentAt { get; set; } = DateTime.Now;

        [ForeignKey("SenderId")]
        public virtual User Sender { get; set; }

        [ForeignKey("ReceiverId")]
        public virtual User Receiver { get; set; }
    }
}