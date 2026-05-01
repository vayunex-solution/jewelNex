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
        public async Task<IActionResult> Create([Bind("Name,DefaultRate,Category,Purity,OpeningStock,OpeningWeight,TotalWeight")] ItemMaster itemMaster)
        {
            if (ModelState.IsValid)
            {
                // Initialize current stock with opening stock and weight
                itemMaster.StockQuantity = itemMaster.OpeningStock;
                itemMaster.TotalWeight = itemMaster.OpeningWeight;
                
                _context.Add(itemMaster);

                // Create a Stock Ledger entry for the opening balance
                if (itemMaster.OpeningStock != 0 || itemMaster.OpeningWeight != 0)
                {
                    var stockEntry = new StockEntry
                    {
                        Item = itemMaster, // Use navigation property for atomic save
                        Date = DateTime.Now,
                        Type = StockEntryType.Opening,
                        ReferenceNo = "OPENING",
                        Quantity = itemMaster.OpeningStock,
                        Weight = itemMaster.OpeningWeight,
                        Remarks = "Initial Opening Balance"
                    };
                    _context.StockEntries.Add(stockEntry);
                }

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
        public async Task<IActionResult> Edit(int id, [Bind("Id,Name,DefaultRate,Category,Purity,StockQuantity,OpeningStock,OpeningWeight,TotalWeight,CreatedAt")] ItemMaster itemMaster)
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
                        // If Opening Stock/Weight was changed, adjust Current Stock by the difference
                        int qtyDiff = itemMaster.OpeningStock - existingItem.OpeningStock;
                        decimal weightDiff = itemMaster.OpeningWeight - existingItem.OpeningWeight;
                        
                        itemMaster.StockQuantity = existingItem.StockQuantity + qtyDiff;
                        itemMaster.TotalWeight = existingItem.TotalWeight + weightDiff;

                        // Also update the Opening Stock entry in ledger if it exists, or create one
                        var openingEntry = await _context.StockEntries
                            .FirstOrDefaultAsync(s => s.ItemMasterId == itemMaster.Id && s.Type == StockEntryType.Opening);
                        
                        if (openingEntry != null)
                        {
                            openingEntry.Quantity = itemMaster.OpeningStock;
                            openingEntry.Weight = itemMaster.OpeningWeight;
                            _context.Update(openingEntry);
                        }
                        else if (itemMaster.OpeningStock != 0 || itemMaster.OpeningWeight != 0)
                        {
                            _context.StockEntries.Add(new StockEntry
                            {
                                ItemMasterId = itemMaster.Id,
                                Date = itemMaster.CreatedAt,
                                Type = StockEntryType.Opening,
                                ReferenceNo = "OPENING",
                                Quantity = itemMaster.OpeningStock,
                                Weight = itemMaster.OpeningWeight,
                                Remarks = "Initial Opening Balance"
                            });
                        }
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

        public async Task<IActionResult> SyncStock()
        {
            try
            {
                // 1. First, align Opening ledger rows with Item Master opening values
                var items = await _context.ItemsMaster.ToListAsync();
                foreach (var item in items)
                {
                    var openingEntry = await _context.StockEntries
                        .FirstOrDefaultAsync(s => s.ItemMasterId == item.Id && s.Type == StockEntryType.Opening);
                    
                    if (openingEntry != null)
                    {
                        openingEntry.Quantity = item.OpeningStock;
                        openingEntry.Weight = item.OpeningWeight;
                        _context.Update(openingEntry);
                    }
                    else if (item.OpeningStock != 0 || item.OpeningWeight != 0)
                    {
                        _context.StockEntries.Add(new StockEntry
                        {
                            ItemMasterId = item.Id,
                            Date = item.CreatedAt,
                            Type = StockEntryType.Opening,
                            ReferenceNo = "OPENING",
                            Quantity = item.OpeningStock,
                            Weight = item.OpeningWeight,
                            Remarks = "Initial Opening Balance (Synced)"
                        });
                    }
                }
                await _context.SaveChangesAsync();

                // 2. Direct SQL Update for atomic accuracy
                await _context.Database.ExecuteSqlRawAsync(@"
                    UPDATE ItemsMaster 
                    SET StockQuantity = (
                        SELECT COALESCE(SUM(Quantity), 0) 
                        FROM StockEntries 
                        WHERE StockEntries.ItemMasterId = ItemsMaster.Id
                    ),
                    TotalWeight = (
                        SELECT COALESCE(SUM(Weight), 0) 
                        FROM StockEntries 
                        WHERE StockEntries.ItemMasterId = ItemsMaster.Id
                    );
                ");

                TempData["Message"] = "Stock levels synchronized successfully from Ledger history!";
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Sync failed: " + ex.Message;
            }

            return RedirectToAction(nameof(Index));
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
                    openingWeight = x.OpeningWeight,
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
