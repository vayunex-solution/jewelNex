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
        public async Task<IActionResult> Ledger(int[] itemIds)
        {
            var items = await _context.ItemsMaster.ToListAsync();
            ViewBag.ItemsList = items;
            ViewBag.SelectedIds = itemIds ?? new int[0];

            if (itemIds == null || !itemIds.Any()) return View(new List<StockEntry>());

            var entries = await _context.StockEntries
                .Include(s => s.Item)
                .Where(s => itemIds.Contains(s.ItemMasterId))
                .OrderBy(s => s.Date)
                .ToListAsync();

            var selectedItems = await _context.ItemsMaster.Where(i => itemIds.Contains(i.Id)).ToListAsync();
            ViewBag.SelectedItems = selectedItems;

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
                // Automatically negate Quantity and Weight for "OUT" types
                if (entry.Type == StockEntryType.IssueSlip || entry.Type == StockEntryType.InvoiceIssue)
                {
                    entry.Quantity = -Math.Abs(entry.Quantity);
                    entry.Weight = -Math.Abs(entry.Weight);
                }

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

            // Re-populate View data if validation fails
            ViewBag.Type = entry.Type;
            ViewBag.Items = new SelectList(await _context.ItemsMaster.ToListAsync(), "Id", "Name", entry.ItemMasterId);
            return View(entry);
        }

        // GET: Stock/BulkIssue
        public async Task<IActionResult> BulkIssue()
        {
            var items = await _context.ItemsMaster.ToListAsync();
            var model = new BulkStockEntryViewModel
            {
                Date = DateTime.Now,
                Items = items.Select(i => new BulkItemEntry
                {
                    ItemId = i.Id,
                    ItemName = i.Name,
                    IsSelected = false
                }).ToList()
            };
            return View(model);
        }

        [HttpPost]
        public async Task<IActionResult> BulkIssue(BulkStockEntryViewModel model)
        {
            if (ModelState.IsValid)
            {
                var selectedItems = model.Items.Where(i => i.IsSelected).ToList();
                if (!selectedItems.Any())
                {
                    ModelState.AddModelError("", "Please select at least one item.");
                    return View(model);
                }

                foreach (var itemEntry in selectedItems)
                {
                    var item = await _context.ItemsMaster.FindAsync(itemEntry.ItemId);
                    if (item != null)
                    {
                        // Deduct stock (negate values)
                        int qty = -Math.Abs(itemEntry.Quantity);
                        decimal weight = -Math.Abs(itemEntry.Weight);

                        item.StockQuantity += qty;
                        item.TotalWeight += weight;

                        var stockEntry = new StockEntry
                        {
                            ReferenceNo = model.ReferenceNo,
                            Date = model.Date,
                            Type = StockEntryType.IssueSlip,
                            ItemMasterId = item.Id,
                            Quantity = qty,
                            Weight = weight,
                            Remarks = model.Remarks
                        };
                        _context.StockEntries.Add(stockEntry);
                    }
                }

                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Ledger));
            }
            return View(model);
        }
    }
}
