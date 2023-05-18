using Microsoft.AspNetCore.Mvc;

namespace ASPNETWEBRTC_PROJECT.Controllers;

public class GameController : Controller
{
    // GET
    public IActionResult Index()
    {
        return View();
    }

    public IActionResult Game()
    {
        return View();
    }
}