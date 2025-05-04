using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.EntityFrameworkCore;
using MusicWebMVC.Data;
using MusicWebMVC.Models;
using MusicWebMVC.Services;


var builder = WebApplication.CreateBuilder(args);

// Lấy Connection String từ appsettings.json
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Đăng ký DbContext vào DI container
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddControllersWithViews();

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

// Thêm Authorization
app.UseAuthorization();

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

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}"
);

app.Run();
