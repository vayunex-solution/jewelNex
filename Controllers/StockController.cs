using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using JewelleryApp.Data;
using JewelleryApp.Models.Jewellery;

namespace JewelleryApp.Controllers
{
    public class StockController : Controller
    {
        private readonly ApplicationDbContext _context;

        public StockController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: Stock/Ledger
        public async Task<IActionResult> Ledger(int? itemId)
        {
            var items = await _context.ItemsMaster.ToListAsync();
            ViewBag.Items = new SelectList(items, "Id", "Name", itemId);

            if (itemId == null) return View();

            var entries = await _context.StockEntries
                .Where(s => s.ItemMasterId == itemId)
                .OrderBy(s => s.Date)
                .ToListAsync();

            var item = await _context.ItemsMaster.FindAsync(itemId);
            ViewBag.SelectedItem = item;

            return View(entries);
        }

        // GET: Stock/Create (Stock In / Production)
        public async Task<IActionResult> Create(StockEntryType type)
        {
            ViewBag.Type = type;
            ViewBag.Items = new SelectList(await _context.ItemsMaster.ToListAsync(), "Id", "Name");
            return View(new StockEntry { Type = type, Date = DateTime.Now });
        }

        [HttpPost]
        public async Task<IActionResult> Create(StockEntry entry)
        {
            if (ModelState.IsValid)
            {
                var item = await _context.ItemsMaster.FindAsync(entry.ItemMasterId);
                if (item != null)
                {
                    // Update ItemMaster Stock real-time (Point 10)
                    item.StockQuantity += entry.Quantity;
                    item.TotalWeight += entry.Weight;
                }

                _context.Add(entry);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Ledger), new { itemId = entry.ItemMasterId });
            }
            return View(entry);
        }
    }
}
