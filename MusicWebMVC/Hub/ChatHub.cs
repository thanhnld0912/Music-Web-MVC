using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;

namespace MusicWebMVC.Hubs
{
    public class ChatHub : Hub
    {
        // Map connection ID to user ID
        public async Task RegisterUser(string userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);
        }

        // Send a message to a specific user
        public async Task SendMessageToUser(string receiverId, string message)
        {
            await Clients.Group(receiverId).SendAsync("ReceiveMessage", Context.ConnectionId, message);
        }

        // Override OnConnectedAsync to log connections
        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }

        // Override OnDisconnectedAsync to clean up
        public override async Task OnDisconnectedAsync(Exception exception)
        {
            await base.OnDisconnectedAsync(exception);
        }
    }
}