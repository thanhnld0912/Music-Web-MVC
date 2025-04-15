using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MusicWebMVC.Models
{
    // Add these model classes at the end of your file (inside the namespace but outside the controller class)
    public class CommentEditModel
    {
        public int UserId { get; set; }
        public string Content { get; set; }
    }
}
