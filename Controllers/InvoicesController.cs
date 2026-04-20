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

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Invoice invoice)
        {
            if (invoice == null) return BadRequest("Invoice data is null");

            try
            {
                // 1. Transactional Integrity: Add Invoice
                _context.Add(invoice);
                await _context.SaveChangesAsync(); // Get Invoice ID

                // 2. STOCK AUTOMATION (Point 8, 9)
                foreach (var item in invoice.Items)
                {
                    var masterItem = await _context.ItemsMaster.FirstOrDefaultAsync(x => x.Name == item.ItemName);
                    if (masterItem != null)
                    {
                        int qtyChange = item.RI == "R" ? 1 : -1;
                        decimal weightChange = item.RI == "R" ? item.GrossWt : -item.GrossWt;

                        // Update Master
                        masterItem.StockQuantity += qtyChange;
                        masterItem.TotalWeight += weightChange;

                        // Create Stock Ledger Entry
                        var stockEntry = new StockEntry
                        {
                            ReferenceNo = $"INV-{invoice.InvoiceNo}",
                            Date = invoice.Date,
                            Type = item.RI == "R" ? StockEntryType.SalesReturn : StockEntryType.InvoiceIssue, // Using SalesReturn for Receipt
                            ItemMasterId = masterItem.Id,
                            Quantity = qtyChange,
                            Weight = weightChange,
                            Remarks = $"Sold to Customer ID: {invoice.CustomerId}"
                        };
                        _context.StockEntries.Add(stockEntry);
                    }
                }

                // 3. ACCOUNTING AUTOMATION (Point 2) - Double Entry Posting
                var voucher = new Voucher
                {
                    VoucherNo = $"JV-{invoice.InvoiceNo}",
                    Date = invoice.Date,
                    Type = VoucherType.General,
                    AccountName = invoice.Customer?.Name ?? "Walk-in Customer",
                    Amount = invoice.TotalAmount,
                    Particulars = $"Sales Invoice No: {invoice.InvoiceNo}"
                };

                // Dr. Customer A/c
                voucher.Items.Add(new VoucherItem { AccountName = invoice.Customer?.Name ?? "Cash Account", Debit = invoice.TotalAmount, Credit = 0, Particulars = "Being Goods Sold" });
                
                // Cr. Sales A/c
                decimal netSales = invoice.TotalAmount - invoice.CGST - invoice.SGST - invoice.IGST;
                voucher.Items.Add(new VoucherItem { AccountName = "Sales Account", Debit = 0, Credit = netSales, Particulars = "Net Sales" });

                // Cr. GST A/cs
                if (invoice.IGST > 0)
                    voucher.Items.Add(new VoucherItem { AccountName = "IGST Account", Debit = 0, Credit = invoice.IGST, Particulars = "IGST Input" });
                else
                {
                    if (invoice.CGST > 0) voucher.Items.Add(new VoucherItem { AccountName = "CGST Account", Debit = 0, Credit = invoice.CGST, Particulars = "CGST Input" });
                    if (invoice.SGST > 0) voucher.Items.Add(new VoucherItem { AccountName = "SGST Account", Debit = 0, Credit = invoice.SGST, Particulars = "SGST Input" });
                }

                _context.Vouchers.Add(voucher);
                await _context.SaveChangesAsync();

                return Ok(new { id = invoice.Id });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
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
