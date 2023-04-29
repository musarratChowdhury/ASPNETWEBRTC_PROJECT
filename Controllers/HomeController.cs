using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using ASPNETWEBRTC_PROJECT.Models;

namespace ASPNETWEBRTC_PROJECT.Controllers;

public class HomeController : Controller
{
 
    public IActionResult Index()
    {
        return View();
    }
    
    public IActionResult JoinRoom()
    {
        return Redirect($"/{Guid.NewGuid()}");
    }

    [HttpGet("/{roomId}")]
    public IActionResult Room (string roomId)
    {
        ViewBag.roomId = roomId;
        return View();
    }
}
