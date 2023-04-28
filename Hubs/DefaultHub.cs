using ASPNETWEBRTC_PROJECT.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace AspNetWebRTC.Hubs
{
    public class DefaultHub : Hub
    {
        public async Task JoinRoom(string roomId, string userId)
        {
            Users.list.Add(Context.ConnectionId, userId);
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
            await Clients.Group(roomId).SendAsync("user-connected", userId,roomId);
            Console.WriteLine(roomId);
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            Clients.All.SendAsync("user-disconnected", Users.list[Context.ConnectionId]);
            return base.OnDisconnectedAsync(exception);
        }
    }
}