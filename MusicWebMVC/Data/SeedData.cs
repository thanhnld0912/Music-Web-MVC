using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MusicWebMVC.Models;
using System;
using System.Linq;

namespace MusicWebMVC.Data
{
    public static class SeedData
    {
        public static void Initialize(IServiceProvider serviceProvider)
        {
            using (var context = new ApplicationDbContext(
                serviceProvider.GetRequiredService<DbContextOptions<ApplicationDbContext>>()))
            {
                // Nếu đã có dữ liệu, không cần seed nữa
                if (context.Users.Any()) return;

                // Seed Users
                context.Users.AddRange(
                    new User
                    {
                        Username = "admin",
                        Email = "admin@musicweb.com",
                        Password = "admin123", // Mật khẩu tạm thời, cần hash nếu muốn bảo mật
                        Role = "Admin",
                        CreatedAt = DateTime.Now
                    },
                    new User
                    {
                        Username = "user1",
                        Email = "user1@musicweb.com",
                        Password = "user1123",
                        Role = "User",
                        CreatedAt = DateTime.Now
                    },
                    new User
                    {
                        Username = "user2",
                        Email = "user2@musicweb.com",
                        Password = "user2",
                        Role = "User",
                        CreatedAt = DateTime.Now
                    }
                );

                // Lưu thay đổi vào database
                context.SaveChanges();
            }
        }
    }
}
