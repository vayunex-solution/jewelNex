using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JewelleryApp.Data;
using JewelleryApp.Models.Jewellery;

namespace JewelleryApp.Controllers
{
    public class SettingsController : Controller
    {
        private readonly ApplicationDbContext _context;

        public SettingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var settings = await _context.ShopSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new ShopSetting();
                _context.ShopSettings.Add(settings);
                await _context.SaveChangesAsync();
            }
            return View(settings);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Update(ShopSetting settings)
        {
            if (ModelState.IsValid)
            {
                _context.Update(settings);
                await _context.SaveChangesAsync();
                TempData["Success"] = "Settings updated successfully!";
                return RedirectToAction(nameof(Index));
            }
            return View("Index", settings);
        }
    }
}
