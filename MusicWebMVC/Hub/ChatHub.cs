using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;
namespace MusicWebMVC.Hubs
{
    public class ChatHub : Hub
    {
        public async Task JoinGroup(string userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);
        }

        public async Task SendMessageToUser(string userId, string message, string senderName, int senderId)
        {
            await Clients.Group(userId).SendAsync("ReceiveMessage", senderId, senderName, message);
        }

        public override async Task OnConnectedAsync()
        {
            var httpContext = Context.GetHttpContext();
            var userIdStr = httpContext?.Session.GetString("UserId");
            if (!string.IsNullOrEmpty(userIdStr) && int.TryParse(userIdStr, out int userId))
            {
                // Ensure we always use string as group name
                string groupName = userId.ToString();
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
                Console.WriteLine($"User {userId} connected to chat hub with connection {Context.ConnectionId}");
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
    }
}