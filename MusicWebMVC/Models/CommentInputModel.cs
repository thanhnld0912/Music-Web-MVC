using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MusicWebMVC.Models
{
    // Model cho việc nhận comment từ client
    public class CommentInputModel
    {
        public string Content { get; set; }
        public int UserId { get; set; }
    }
}
