using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MusicWebMVC.Models
{
    public class CommentReportModel
    {
        public int UserId { get; set; }
        public string Reason { get; set; }
    }
}
