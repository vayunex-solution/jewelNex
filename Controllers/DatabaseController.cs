using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JewelleryApp.Data;
using System.Threading.Tasks;

namespace JewelleryApp.Controllers
{
    public class DatabaseController : Controller
    {
        private readonly ApplicationDbContext _context;

        public DatabaseController(ApplicationDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CleanDatabase()
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Delete Accounting Data
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM VoucherItems");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Vouchers");
                
                // 2. Delete Transaction Data
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM InvoiceItems");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Invoices");
                
                // 3. Delete Inventory Data (Stock Entries)
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM StockEntries");
                
                // 4. Delete Customers
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Customers");

                // 5. Reset ItemMaster balances (Keep the items, but set stock to 0)
                await _context.Database.ExecuteSqlRawAsync("UPDATE ItemsMaster SET StockQuantity = 0, TotalWeight = 0");

                // Optional: Reset Identity counters for SQLite
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM sqlite_sequence WHERE name IN ('Vouchers', 'VoucherItems', 'Invoices', 'InvoiceItems', 'StockEntries', 'Customers')");

                await transaction.CommitAsync();
                TempData["Success"] = "Database cleaned successfully! All transactions removed and stock reset to zero.";
            }
            catch (System.Exception ex)
            {
                await transaction.RollbackAsync();
                TempData["Error"] = "Error cleaning database: " + ex.Message;
            }

            return RedirectToAction(nameof(Index));
        }
    }
}
