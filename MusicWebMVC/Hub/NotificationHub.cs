// Hubs/NotificationHub.cs
using Microsoft.AspNetCore.SignalR;

namespace MusicWebMVC.Hubs
{
    public class NotificationHub : Hub
    {
        public async Task SendNotification(string userId, string message, string type, string url)
        {
            await Clients.All.SendAsync("ReceiveNotification", userId, message, type, url);
        }

        public async Task UpdateCount(string type, int itemId, int newCount)
        {
            await Clients.All.SendAsync("ReceiveCountUpdate", type, itemId, newCount);
        }
        public override async Task OnConnectedAsync()
        {
            var httpContext = Context.GetHttpContext();
            var userIdStr = httpContext?.Session.GetString("UserId");

            if (!string.IsNullOrEmpty(userIdStr) && int.TryParse(userIdStr, out int userId))
            {
                // Đảm bảo luôn dùng string làm tên group
                string groupName = userId.ToString();
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
             
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var httpContext = Context.GetHttpContext();
            var userId = httpContext?.Session.GetString("UserId");

            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, userId);
             
            }

            await base.OnDisconnectedAsync(exception);
        }
        public async Task JoinGroup(string userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);
        }
    }
}
