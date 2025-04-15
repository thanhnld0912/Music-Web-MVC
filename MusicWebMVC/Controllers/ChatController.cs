﻿using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MusicWebMVC.Data;
using MusicWebMVC.Hubs;
using MusicWebMVC.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicWebMVC.Controllers
{
    public class ChatController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<ChatHub> _chatHubContext;

        public ChatController(ApplicationDbContext context, IHubContext<ChatHub> chatHubContext)
        {
            _context = context;
            _chatHubContext = chatHubContext;
        }

        // Main chat page
        public IActionResult Messages()
        {
            // Check if user is logged in
            var userId = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userId))
                return RedirectToAction("Login", "Account");

            return View();
        }

        // Get recent conversations
        [HttpGet("Chat/GetRecentConversations/{userId}")]
        public async Task<IActionResult> GetRecentConversations(int userId)
        {
            // Get all messages where current user is sender or receiver
            var messages = await _context.Messages
                .Where(m => m.SenderId == userId || m.ReceiverId == userId)
                .OrderByDescending(m => m.SentAt)
                .ToListAsync();

            // Group by conversation
            var conversations = messages
                .GroupBy(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
                .Select(g => new
                {
                    UserId = g.Key,
                    LastMessage = g.First().Content,
                    LastMessageTime = g.First().SentAt,
                    UnreadCount = g.Count(m => m.ReceiverId == userId && !m.IsRead)
                })
                .ToList();

            // Get user details for each conversation
            var result = new List<object>();
            foreach (var conv in conversations)
            {
                var user = await _context.Users.FindAsync(conv.UserId);
                if (user != null)
                {
                    result.Add(new
                    {
                        UserId = user.Id,
                        Username = user.Username,
                        AvatarUrl = "/img/avatar.jpg", // Replace with actual avatar URL when available
                        LastMessage = conv.LastMessage,
                        LastMessageTime = conv.LastMessageTime,
                        UnreadCount = conv.UnreadCount
                    });
                }
            }

            return Json(result);
        }
        [HttpGet("Chat/GetMessages/{otherUserId}")]
        public async Task<IActionResult> GetMessages(int otherUserId)
        {
            var currentUserId = int.Parse(HttpContext.Session.GetString("UserId"));

            // Get all messages between current user and other user
            var messages = await _context.Messages
                .Where(m =>
                    (m.SenderId == currentUserId && m.ReceiverId == otherUserId) ||
                    (m.SenderId == otherUserId && m.ReceiverId == currentUserId))
                .OrderBy(m => m.SentAt)
                .ToListAsync();

            // Mark messages as read
            var unreadMessages = messages.Where(m => m.ReceiverId == currentUserId && !m.IsRead).ToList();
            foreach (var message in unreadMessages)
            {
                message.IsRead = true;
            }
            await _context.SaveChangesAsync();

            // Format for frontend
            var result = messages.Select(m => new
            {
                Id = m.Id,
                Content = m.Content,
                SentAt = m.SentAt,
                IsFromCurrentUser = m.SenderId == currentUserId
            }).ToList();

            return Json(result);
        }

        // Send a message
        [HttpPost("Chat/SendMessage")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageViewModel model)
        {
            if (!ModelState.IsValid)
                return Json(new { success = false, message = "Invalid data" });

            var currentUserId = int.Parse(HttpContext.Session.GetString("UserId"));
            var receiver = await _context.Users.FindAsync(model.ReceiverId);

            if (receiver == null)
                return Json(new { success = false, message = "Receiver not found" });

            // Check if users can message each other (they follow each other or receiver is admin)
            bool canMessage = await _context.Follows.AnyAsync(f =>
                                  (f.FollowerId == currentUserId && f.FollowingId == model.ReceiverId) &&
                                  (f.FollowerId == model.ReceiverId && f.FollowingId == currentUserId));

            // Allow admin to message anyone
            var currentUser = await _context.Users.FindAsync(currentUserId);
            if (currentUser?.Role == "Admin")
                canMessage = true;

            if (!canMessage)
                return Json(new { success = false, message = "You cannot message this user" });

            // Create message
            var message = new Message
            {
                SenderId = currentUserId,
                ReceiverId = model.ReceiverId,
                Content = model.Content,
                SentAt = DateTime.Now
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // Send real-time notification
            var sender = await _context.Users.FindAsync(currentUserId);
            await _chatHubContext.Clients.User(model.ReceiverId.ToString())
                .SendAsync("ReceiveMessage", currentUserId, sender.Username, model.Content);

            return Json(new { success = true, messageId = message.Id });
        }

        // Mark conversation as read
        [HttpPost("Chat/MarkAsRead/{otherUserId}")]
        public async Task<IActionResult> MarkAsRead(int otherUserId)
        {
            var currentUserId = int.Parse(HttpContext.Session.GetString("UserId"));

            // Find all unread messages from the other user
            var unreadMessages = await _context.Messages
                .Where(m => m.SenderId == otherUserId && m.ReceiverId == currentUserId && !m.IsRead)
                .ToListAsync();

            // Mark them as read
            foreach (var message in unreadMessages)
            {
                message.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return Json(new { success = true, count = unreadMessages.Count });
        }

        // Search users for new message
        [HttpGet("Chat/SearchUsers")]
        public async Task<IActionResult> SearchUsers(string term)
        {
            if (string.IsNullOrEmpty(term) || term.Length < 2)
                return Json(new List<object>());

            var currentUserId = int.Parse(HttpContext.Session.GetString("UserId"));

            // Find users who the current user follows or who follow the current user
            // Or find admin users
            var follows = await _context.Follows
                .Where(f => f.FollowerId == currentUserId || f.FollowingId == currentUserId)
                .Select(f => f.FollowerId == currentUserId ? f.FollowingId : f.FollowerId)
                .Distinct()
                .ToListAsync();

            var adminUserIds = await _context.Users
                .Where(u => u.Role == "Admin")
                .Select(u => u.Id)
                .ToListAsync();

            var userIds = follows.Union(adminUserIds).Distinct();

            // Search these users by username
            var users = await _context.Users
                .Where(u => userIds.Contains(u.Id) && u.Username.Contains(term) && u.Id != currentUserId)
                .Select(u => new
                {
                    Id = u.Id,
                    Username = u.Username,
                    AvatarUrl = "/img/avatar.jpg" // Replace with actual avatar URL when available
                })
                .ToListAsync();

            return Json(users);
        }

        // Get user by username
        [HttpGet("Chat/GetUserByName")]
        public async Task<IActionResult> GetUserByName(string username)
        {
            if (string.IsNullOrEmpty(username))
                return Json(new { });

            var user = await _context.Users
                .Where(u => u.Username == username)
                .Select(u => new
                {
                    Id = u.Id,
                    Username = u.Username,
                    AvatarUrl = "/img/avatar.jpg" // Replace with actual avatar URL when available
                })
                .FirstOrDefaultAsync();

            return Json(user);
        }
    }

    // View Model for sending messages
    public class SendMessageViewModel
    {
        public int ReceiverId { get; set; }
        public string Content { get; set; }
    }
}