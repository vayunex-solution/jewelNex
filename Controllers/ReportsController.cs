using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JewelleryApp.Data;
using JewelleryApp.Models.Jewellery;

namespace JewelleryApp.Controllers
{
    public class ReportsController : Controller
    {
        private readonly ApplicationDbContext _context;

        public ReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var invoices = await _context.Invoices
                .Include(i => i.Customer)
                .OrderByDescending(i => i.Date)
                .ToListAsync();

            var summary = new ReportSummary
            {
                TotalCash = invoices.Where(i => i.PaymentMode == "Cash").Sum(i => i.PaidAmount),
                TotalUPI = invoices.Where(i => i.PaymentMode == "UPI").Sum(i => i.PaidAmount),
                TotalCard = invoices.Where(i => i.PaymentMode == "Card").Sum(i => i.PaidAmount),
                TotalOutstanding = invoices.Sum(i => i.TotalAmount - i.PaidAmount),
                PendingInvoices = invoices.Where(i => i.TotalAmount > i.PaidAmount).ToList()
            };

            return View(summary);
        }

        public async Task<IActionResult> AllInvoices()
        {
            var invoices = await _context.Invoices
                .Include(i => i.Customer)
                .OrderByDescending(i => i.Date)
                .ToListAsync();

            return View(invoices);
        }
    }

    public class ReportSummary
    {
        public decimal TotalCash { get; set; }
        public decimal TotalUPI { get; set; }
        public decimal TotalCard { get; set; }
        public decimal TotalOutstanding { get; set; }
        public List<Invoice> PendingInvoices { get; set; } = new();
    }
}
