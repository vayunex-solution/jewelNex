using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JewelleryApp.Data;
using JewelleryApp.Models.Jewellery;
using JewelleryApp.Utilities;
using System;
using System.Threading.Tasks;

namespace JewelleryApp.Controllers
{
    public class RegistrationController : Controller
    {
        private readonly ApplicationDbContext _context;

        public RegistrationController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index(string status = "")
        {
            var machineId = SecurityKeys.GetMachineId();
            ViewBag.MachineId = machineId;
            ViewBag.Status = status;
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Activate(string licenseKey)
        {
            if (string.IsNullOrEmpty(licenseKey))
            {
                TempData["Error"] = "License key cannot be empty.";
                return RedirectToAction(nameof(Index));
            }

            var machineId = SecurityKeys.GetMachineId();
            var verification = SecurityKeys.VerifyKeyAndGetDays(machineId, licenseKey);

            if (verification.IsValid)
            {
                var settings = await _context.ShopSettings.FirstOrDefaultAsync();
                if (settings == null)
                {
                    settings = new ShopSetting { ShopName = "NEW INSTALLATION" };
                    _context.ShopSettings.Add(settings);
                }

                settings.LicenseKey = licenseKey.Trim().ToUpper();
                settings.LastKnownMachineId = machineId;
                settings.ActivationDate = DateTime.Now;
                settings.ExpiryDays = verification.ValidityDays;
                
                await _context.SaveChangesAsync();
                TempData["Success"] = verification.ValidityDays > 0 
                    ? $"✨ Trial Activated! Valid for {verification.ValidityDays} days."
                    : "✨ Application Activated Successfully (Permanent)!";

                return RedirectToAction("Index", "Home");
            }
            else
            {
                TempData["Error"] = "❌ Invalid License Key for this machine! Please contact the administrator.";
                return RedirectToAction(nameof(Index));
            }
        }
    }
}
