using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using System.IO;
using System;
using System.Threading.Tasks;

namespace JewelleryApp.Controllers
{
    public class DatabaseController : Controller
    {
        private readonly IWebHostEnvironment _env;
        private readonly IConfiguration _config;

        public DatabaseController(IWebHostEnvironment env, IConfiguration config)
        {
            _env = env;
            _config = config;
        }

        public IActionResult Index()
        {
            var dbPath = Path.Combine(_env.ContentRootPath, "jewellery_v5.db");
            ViewBag.DbExists = System.IO.File.Exists(dbPath);
            if (ViewBag.DbExists)
            {
                var fileInfo = new FileInfo(dbPath);
                ViewBag.DbSize = (fileInfo.Length / 1024.0).ToString("F2") + " KB";
                ViewBag.LastModified = fileInfo.LastWriteTime.ToString("dd MMM yyyy HH:mm:ss");
            }
            return View();
        }

        [HttpGet]
        public IActionResult Export()
        {
            var dbPath = Path.Combine(_env.ContentRootPath, "jewellery_v5.db");
            if (!System.IO.File.Exists(dbPath))
            {
                TempData["Error"] = "Database file not found.";
                return RedirectToAction(nameof(Index));
            }

            try
            {
                // Force sync and clear pools to ensure we get a clean copy if possible
                SqliteConnection.ClearAllPools();
                
                var bytes = System.IO.File.ReadAllBytes(dbPath);
                return File(bytes, "application/x-sqlite3", $"backup_{DateTime.Now:yyyyMMddHHmmss}.db");
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Error exporting database: " + ex.Message;
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpPost]
        public async Task<IActionResult> Import(IFormFile dbFile)
        {
            if (dbFile != null && dbFile.Length > 0)
            {
                if (!dbFile.FileName.EndsWith(".db"))
                {
                    TempData["Error"] = "Invalid file type. Please upload a .db file.";
                    return RedirectToAction(nameof(Index));
                }

                var dbPath = Path.Combine(_env.ContentRootPath, "jewellery_v5.db");
                
                // Close all connections to the database to avoid file locking
                SqliteConnection.ClearAllPools();
                
                var backupPath = dbPath + ".bak";
                bool backedUp = false;
                if (System.IO.File.Exists(dbPath))
                {
                    try {
                        System.IO.File.Copy(dbPath, backupPath, true);
                        backedUp = true;
                    } catch { }
                }

                try
                {
                    using (var stream = new FileStream(dbPath, FileMode.Create))
                    {
                        await dbFile.CopyToAsync(stream);
                    }
                    TempData["Success"] = "Database imported successfully! You might need to refresh the page or restart the app if data doesn't appear immediately.";
                }
                catch (Exception ex)
                {
                    TempData["Error"] = "Error importing database: " + ex.Message;
                    // Restore from backup if possible
                    if (backedUp && System.IO.File.Exists(backupPath))
                    {
                        System.IO.File.Copy(backupPath, dbPath, true);
                    }
                }
            }
            else
            {
                TempData["Error"] = "Please select a valid .db file.";
            }

            return RedirectToAction(nameof(Index));
        }
    }
}
