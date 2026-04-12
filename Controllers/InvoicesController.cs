using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JewelleryApp.Data;
using JewelleryApp.Models.Jewellery;

namespace JewelleryApp.Controllers
{
    public class InvoicesController : Controller
    {
        private readonly ApplicationDbContext _context;

        public InvoicesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: Invoices
        public async Task<IActionResult> Index()
        {
            var invoices = await _context.Invoices.Include(i => i.Customer).ToListAsync();
            return View(invoices);
        }

        // GET: Invoices/Create
        public IActionResult Create()
        {
            return View();
        }

        // POST: Invoices/Create
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Invoice invoice)
        {
            if (invoice == null) return BadRequest("Invoice data is null");

            try
            {
                // Decrement Stock in ItemMaster
                foreach (var item in invoice.Items)
                {
                    var masterItem = await _context.ItemsMaster.FirstOrDefaultAsync(x => x.Name == item.ItemName);
                    if (masterItem != null)
                    {
                        masterItem.StockQuantity -= 1; // Sold 1 unit
                    }
                }

                _context.Add(invoice);
                await _context.SaveChangesAsync();
                return Ok(new { id = invoice.Id });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // GET: Invoices/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null) return NotFound();

            var invoice = await _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.Items)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (invoice == null) return NotFound();

            return View(invoice);
        }

        public async Task<IActionResult> Estimate(int? id)
        {
            if (id == null) return NotFound();

            var invoice = await _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.Items)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (invoice == null) return NotFound();

            return View(invoice);
        }

        public async Task<IActionResult> TaxInvoice(int? id)
        {
            if (id == null) return NotFound();

            var invoice = await _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.Items)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (invoice == null) return NotFound();

            return View(invoice);
        }
    }
}
