using Microsoft.AspNetCore.Mvc;

namespace ASPNETWEBRTC_PROJECT.Controllers;

public class GameController : Controller
{
    // GET
    public IActionResult Index()
    {
        return View();
    }

    public IActionResult JoinGameRoom()
    {
        return Redirect($"/match:{Guid.NewGuid()}");
    }

    [HttpGet("/match:{roomId}")]
    public IActionResult Game (string roomId)
    {
        ViewBag.roomId = roomId;
        return View();
    }
}