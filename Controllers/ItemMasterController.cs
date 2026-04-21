using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JewelleryApp.Data;
using JewelleryApp.Models.Jewellery;

namespace JewelleryApp.Controllers
{
    public class ItemMasterController : Controller
    {
        private readonly ApplicationDbContext _context;

        public ItemMasterController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: ItemMaster
        public async Task<IActionResult> Index()
        {
            return View(await _context.ItemsMaster.OrderBy(x => x.Name).ToListAsync());
        }

        // GET: ItemMaster/Create
        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("Name,DefaultRate,Category,Purity,OpeningStock,TotalWeight")] ItemMaster itemMaster)
        {
            if (ModelState.IsValid)
            {
                // Initialize current stock with opening stock
                itemMaster.StockQuantity = itemMaster.OpeningStock;
                
                _context.Add(itemMaster);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(itemMaster);
        }

        // GET: ItemMaster/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();
            var itemMaster = await _context.ItemsMaster.FindAsync(id);
            if (itemMaster == null) return NotFound();
            return View(itemMaster);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("Id,Name,DefaultRate,Category,Purity,StockQuantity,OpeningStock,TotalWeight,CreatedAt")] ItemMaster itemMaster)
        {
            if (id != itemMaster.Id) return NotFound();

            if (ModelState.IsValid)
            {
                try
                {
                    // Fetch existing item to calculate stock difference
                    var existingItem = await _context.ItemsMaster.AsNoTracking().FirstOrDefaultAsync(i => i.Id == itemMaster.Id);
                    if (existingItem != null)
                    {
                        // If Opening Stock was changed, adjust Current Stock by the difference
                        int diff = itemMaster.OpeningStock - existingItem.OpeningStock;
                        itemMaster.StockQuantity = existingItem.StockQuantity + diff;
                    }
                    
                    _context.Update(itemMaster);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!_context.ItemsMaster.Any(e => e.Id == itemMaster.Id)) return NotFound();
                    else throw;
                }
                return RedirectToAction(nameof(Index));
            }
            return View(itemMaster);
        }

        public async Task<JsonResult> GetAllItems()
        {
            var items = await _context.ItemsMaster
                .Select(x => new { 
                    id = x.Id, 
                    name = x.Name, 
                    defaultRate = x.DefaultRate, 
                    purity = x.Purity, 
                    stockQuantity = x.StockQuantity,
                    openingStock = x.OpeningStock,
                    totalWeight = x.TotalWeight,
                    category = x.Category
                })
                .ToListAsync();
            return Json(items);
        }

        // Delete (Simplified)
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.ItemsMaster.FindAsync(id);
            if (item != null)
            {
                _context.ItemsMaster.Remove(item);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }
    }
}
