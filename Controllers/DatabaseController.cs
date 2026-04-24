using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JewelleryApp.Data;
using System.Threading.Tasks;
using System.IO;
using Microsoft.AspNetCore.Http;
using System;
using System.Linq;

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
        public async Task<IActionResult> UpdateCustomerSchema()
        {
            try
            {
                // Add OpeningBalance
                try {
                    await _context.Database.ExecuteSqlRawAsync("ALTER TABLE Customers ADD COLUMN OpeningBalance DECIMAL(18, 2) NOT NULL DEFAULT 0");
                } catch { /* Column might already exist */ }

                // Add BalanceType
                try {
                    await _context.Database.ExecuteSqlRawAsync("ALTER TABLE Customers ADD COLUMN BalanceType INTEGER NOT NULL DEFAULT 1");
                } catch { /* Column might already exist */ }

                TempData["Success"] = "Customer table schema updated successfully!";
            }
            catch (System.Exception ex)
            {
                TempData["Error"] = "Error updating schema: " + ex.Message;
            }

            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CleanDatabase(string password)
        {
            if (password != "jks1988@1122")
            {
                TempData["Error"] = "Invalid Security Password! Database cleanup aborted.";
                return RedirectToAction(nameof(Index));
            }

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
                await _context.Database.ExecuteSqlRawAsync("UPDATE ItemsMaster SET StockQuantity = 0, TotalWeight = 0, OpeningStock = 0");

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

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> GenerateKey(string targetMachineId, int validityDays, string adminPassword)
        {
            if (adminPassword != "jks1988@1122")
            {
                TempData["Error"] = "Unauthorized. Admin password required for key generation.";
                return RedirectToAction(nameof(Index));
            }

            if (string.IsNullOrEmpty(targetMachineId))
            {
                TempData["Error"] = "Please provide a valid Machine ID.";
                return RedirectToAction(nameof(Index));
            }

            var generatedKey = JewelleryApp.Utilities.SecurityKeys.GenerateLicenseKey(targetMachineId, validityDays);
            TempData["GeneratedKey"] = generatedKey;
            TempData["KeyForId"] = targetMachineId;
            TempData["Success"] = "Key generated successfully for Machine ID: " + targetMachineId;
            
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ClearLicense(string adminPassword)
        {
            if (adminPassword != "jks1988@1122")
            {
                TempData["Error"] = "Unauthorized. Admin password required to clear license.";
                return RedirectToAction(nameof(Index));
            }

            var settings = await _context.ShopSettings.FirstOrDefaultAsync();
            if (settings != null)
            {
                settings.LicenseKey = null;
                settings.LastKnownMachineId = null;
                settings.ActivationDate = null;
                settings.ExpiryDays = 0;
                await _context.SaveChangesAsync();
                TempData["Success"] = "License cleared successfully! The application is now locked.";
            }

            return RedirectToAction(nameof(Index));
        }
        
        public IActionResult Backup()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Export()
        {
            try
            {
                string dbPath = "jewellery_v5.db";
                if (!System.IO.File.Exists(dbPath))
                {
                    TempData["Error"] = "Database file not found!";
                    return RedirectToAction(nameof(Backup));
                }

                // Create a temporary copy to avoid "file in use" errors
                string tempPath = Path.Combine(Path.GetTempPath(), $"temp_{Guid.NewGuid()}.db");
                System.IO.File.Copy(dbPath, tempPath, true);

                var bytes = await System.IO.File.ReadAllBytesAsync(tempPath);
                
                // Clean up temp file
                if (System.IO.File.Exists(tempPath)) System.IO.File.Delete(tempPath);

                string fileName = $"dbjewellery_{DateTime.Now:dd-MM-yyyy}.db";
                return File(bytes, "application/octet-stream", fileName);
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Export failed: " + ex.Message;
                return RedirectToAction(nameof(Backup));
            }
        }

        [HttpPost]
        public async Task<IActionResult> Import(IFormFile backupFile)
        {
            if (backupFile == null || backupFile.Length == 0)
            {
                TempData["Error"] = "Please select a valid .db file.";
                return RedirectToAction(nameof(Backup));
            }

            string tempPath = Path.Combine(Path.GetTempPath(), $"restore_{Guid.NewGuid()}.db");
            try
            {
                // 1. Save to temporary location
                using (var stream = new FileStream(tempPath, FileMode.Create))
                {
                    await backupFile.CopyToAsync(stream);
                }

                // 2. Validate SQLite Structure
                bool isValid = false;
                try
                {
                    using (var conn = new Microsoft.Data.Sqlite.SqliteConnection($"Data Source={tempPath};Pooling=False"))
                    {
                        conn.Open();
                        using (var cmd = conn.CreateCommand())
                        {
                            // Check for essential tables to ensure it's our DB format
                            cmd.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('ShopSettings', 'Invoices', 'Customers', 'ItemsMaster')";
                            var result = cmd.ExecuteScalar();
                            if (result != null) isValid = true;
                        }
                        conn.Close();
                    }
                }
                catch
                {
                    isValid = false;
                }

                if (!isValid)
                {
                    if (System.IO.File.Exists(tempPath)) System.IO.File.Delete(tempPath);
                    TempData["Error"] = "Invalid backup file. The file is either corrupted or not a valid Jewellery ERP backup.";
                    return RedirectToAction(nameof(Backup));
                }

                // 3. Perform the Restore (Safe Swap)
                string dbPath = "jewellery_v5.db";
                
                _context.Database.CloseConnection();
                Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
                
                // Give OS a moment to release handles
                GC.Collect();
                GC.WaitForPendingFinalizers();

                // Overwrite current DB
                System.IO.File.Copy(tempPath, dbPath, true);
                
                // Also delete SQLite sidecar files if they exist (WAL/SHM)
                string walPath = dbPath + "-wal";
                string shmPath = dbPath + "-shm";
                if (System.IO.File.Exists(walPath)) System.IO.File.Delete(walPath);
                if (System.IO.File.Exists(shmPath)) System.IO.File.Delete(shmPath);

                // Cleanup temp
                if (System.IO.File.Exists(tempPath)) System.IO.File.Delete(tempPath);

                TempData["Success"] = "Database restored successfully!";
            }
            catch (Exception ex)
            {
                if (System.IO.File.Exists(tempPath)) System.IO.File.Delete(tempPath);
                TempData["Error"] = "Restore failed: " + ex.Message;
            }

            return RedirectToAction(nameof(Backup));
        }
    }
}
