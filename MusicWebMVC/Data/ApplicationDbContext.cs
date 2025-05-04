using Microsoft.EntityFrameworkCore;
using MusicWebMVC.Models;

namespace MusicWebMVC.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }
        public ApplicationDbContext() { }

        public DbSet<User> Users { get; set; }
        public DbSet<Post> Posts { get; set; }
        public DbSet<Song> Songs { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<Like> Likes { get; set; }
        public DbSet<Dislike> Dislikes { get; set; }
        public DbSet<Follow> Follows { get; set; }
        public DbSet<Playlist> Playlists { get; set; }
        public DbSet<PlaylistSong> PlaylistSongs { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseSqlServer("Your_Connection_String");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Thiết lập quan hệ User - Post
            modelBuilder.Entity<Post>()
                .HasOne(p => p.User)
                .WithMany(u => u.Posts)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Thiết lập quan hệ Post - Song (mỗi Post chỉ có một Song)
            modelBuilder.Entity<Post>()
               .HasOne(p => p.Song)
               .WithOne(s => s.Post)
               .HasForeignKey<Song>(s => s.PostId)
               .OnDelete(DeleteBehavior.Cascade);

            // Quan hệ giữa User và Like
            modelBuilder.Entity<Like>()
                .HasOne(l => l.User)
                .WithMany(u => u.Likes)
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Like>()
                .HasOne(l => l.Post)
                .WithMany(p => p.Likes)
                .HasForeignKey(l => l.PostId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Like>()
                .HasOne(l => l.Song)
                .WithMany(s => s.Likes)
                .HasForeignKey(l => l.SongId)
                .OnDelete(DeleteBehavior.Restrict);

            // Quan hệ giữa User và Dislike
            modelBuilder.Entity<Dislike>()
                .HasOne(d => d.User)
                .WithMany()
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Dislike>()
                .HasOne(d => d.Post)
                .WithMany(p => p.Dislikes)
                .HasForeignKey(d => d.PostId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Dislike>()
                .HasOne(d => d.Song)
                .WithMany(s => s.Dislikes)
                .HasForeignKey(d => d.SongId)
                .OnDelete(DeleteBehavior.Restrict);

            // Quan hệ giữa Comment và Post
            modelBuilder.Entity<Comment>()
                .HasOne(c => c.Post)
                .WithMany(p => p.Comments)
                .HasForeignKey(c => c.PostId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure Follow relationships
            modelBuilder.Entity<Follow>()
                .HasOne(f => f.Follower)
                .WithMany(u => u.Following)
                .HasForeignKey(f => f.FollowerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Follow>()
                .HasOne(f => f.Following)
                .WithMany(u => u.Followers)
                .HasForeignKey(f => f.FollowingId)
                .OnDelete(DeleteBehavior.Restrict);
            // Quan hệ giữa User và Playlist
            modelBuilder.Entity<Playlist>()
                .HasOne(p => p.User)
                .WithMany(u => u.Playlists)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Thiết lập quan hệ nhiều-nhiều giữa Playlist và Song
            modelBuilder.Entity<PlaylistSong>()
                .HasKey(ps => new { ps.PlaylistId, ps.SongId });

            modelBuilder.Entity<PlaylistSong>()
                .HasOne(ps => ps.Playlist)
                .WithMany(p => p.PlaylistSongs)
                .HasForeignKey(ps => ps.PlaylistId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PlaylistSong>()
                .HasOne(ps => ps.Song)
                .WithMany(s => s.PlaylistSongs)
                .HasForeignKey(ps => ps.SongId)
                .OnDelete(DeleteBehavior.Restrict);
            // Quan hệ User - Song (qua ArtistId)
            modelBuilder.Entity<Song>()
                .HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.ArtistId)
                .OnDelete(DeleteBehavior.Restrict);
        }



        public static void Seed(ApplicationDbContext context)
        {
            // Kiểm tra nếu cơ sở dữ liệu không có người dùng nào
            if (!context.Users.Any())
            {
                var adminUser = new User
                {
                    Username = "admin",
                    Email = "admin@example.com",
                    Password = "Admin@123", // Bạn có thể mã hóa mật khẩu nếu cần
                    Role = "Admin",  // Đặt vai trò là Admin
                    CreatedAt = DateTime.Now,
                    Bio = "Administrator of the MusicWeb platform",
                    level = "Bronze"
                };

                context.Users.Add(adminUser);
                context.SaveChanges();
            }
        }
    }
}
