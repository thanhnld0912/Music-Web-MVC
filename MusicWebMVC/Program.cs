﻿using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.EntityFrameworkCore;
using MusicWebMVC.Data;
using MusicWebMVC.Hubs;
using MusicWebMVC.Models;
using MusicWebMVC.Services;

var builder = WebApplication.CreateBuilder(args);

// Lấy Connection String từ appsettings.json
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Đăng ký DbContext vào DI container
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddControllersWithViews();
builder.Services.AddSignalR();

// Thêm dịch vụ Session
builder.Services.AddDistributedMemoryCache(); // Sử dụng bộ nhớ tạm
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30); // Session timeout trong 30 phút
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;

});



// Thêm HttpContextAccessor để truy cập Session từ view
builder.Services.AddHttpContextAccessor();


// Đăng ký dịch vụ Email
builder.Services.AddScoped<IEmailService, EmailService>();




// COnfiguration login google
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme;

}).AddCookie().AddGoogle(GoogleDefaults.AuthenticationScheme, options =>
{
    options.ClientId = builder.Configuration.GetSection("GoogleKeys:ClientId").Value;
    options.ClientSecret = builder.Configuration.GetSection("GoogleKeys:ClientSecret").Value;
});
//---------Configuration Login Google

builder.Services.AddSingleton<IVNPayService, VNPayService>();

var app = builder.Build();

// Môi trường phát triển, hiển thị lỗi chi tiết
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

// Cấu hình các middleware
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();

// Sử dụng Session
app.UseSession();

app.UseAuthentication();

// Thêm Authorization
app.UseAuthorization();

app.UseMiddleware<ActivityTrackingMiddleware>();

// Gọi phương thức Seed sau khi database đã được cấu hình
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<ApplicationDbContext>();

    // Tạo database và seed dữ liệu nếu cần
    context.Database.Migrate();  // Đảm bảo database được tạo ra và cập nhật

    // Gọi phương thức Seed để thêm người dùng admin nếu chưa có
    ApplicationDbContext.Seed(context);
}
app.MapControllers();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}"
);


app.MapHub<NotificationHub>("/notificationHub");
app.MapHub<ChatHub>("/chatHub");

app.Run();
