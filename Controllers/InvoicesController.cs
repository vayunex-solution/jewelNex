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
                // 1. Resolve Customer Identity & Name
                string customerName = "Walk-in Customer";
                if (invoice.CustomerId == 0 && invoice.Customer != null && !string.IsNullOrEmpty(invoice.Customer.Name))
                {
                    var existing = await _context.Customers.FirstOrDefaultAsync(c => c.Mobile == invoice.Customer.Mobile);
                    if (existing == null)
                    {
                        // Auto-generate Customer Code for Quick-Add
                        int maxId = await _context.Customers.AnyAsync() ? await _context.Customers.MaxAsync(c => c.Id) : 0;
                        invoice.Customer.CustomerCode = $"CUST{(maxId + 1):D4}";

                        _context.Customers.Add(invoice.Customer);
                        await _context.SaveChangesAsync();
                        invoice.CustomerId = invoice.Customer.Id;
                        customerName = invoice.Customer.Name;
                    }
                    else
                    {
                        invoice.CustomerId = existing.Id;
                        customerName = existing.Name;
                    }
                    invoice.Customer = null; 
                }
                else if (invoice.CustomerId > 0)
                {
                    var cust = await _context.Customers.FindAsync(invoice.CustomerId);
                    customerName = cust?.Name ?? "Existing Customer";
                }

                // 2. Add Invoice
                _context.Add(invoice);
                await _context.SaveChangesAsync();

                // 3. STOCK AUTOMATION
                foreach (var item in invoice.Items)
                {
                    var masterItem = await _context.ItemsMaster.FirstOrDefaultAsync(x => x.Name == item.ItemName);
                    if (masterItem != null)
                    {
                        int qtyChange = item.RI == "R" ? 1 : -1;
                        decimal weightChange = item.RI == "R" ? item.GrossWt : -item.GrossWt;
                        masterItem.StockQuantity += qtyChange;
                        masterItem.TotalWeight += weightChange;

                        var stockEntry = new StockEntry
                        {
                            ReferenceNo = $"INV-{invoice.InvoiceNo}",
                            Date = invoice.Date,
                            Type = item.RI == "R" ? StockEntryType.SalesReturn : StockEntryType.InvoiceIssue,
                            ItemMasterId = masterItem.Id,
                            Quantity = qtyChange,
                            Weight = weightChange,
                            Remarks = $"Ref: {invoice.InvoiceNo}"
                        };
                        _context.StockEntries.Add(stockEntry);
                    }
                }

                // 4. ACCOUNTING: Sales Voucher (Debit Customer, Credit Sales/GST)
                var salesVoucher = new Voucher
                {
                    VoucherNo = $"JV-{invoice.InvoiceNo}",
                    Date = invoice.Date,
                    Type = VoucherType.General,
                    AccountName = customerName,
                    Amount = invoice.TotalAmount,
                    Particulars = $"Sales Invoice No: {invoice.InvoiceNo}"
                };

                salesVoucher.Items.Add(new VoucherItem { AccountName = customerName, Debit = invoice.TotalAmount, Credit = 0, Particulars = "Goods Sold" });
                
                decimal netSales = invoice.TotalAmount - invoice.CGST - invoice.SGST - invoice.IGST;
                salesVoucher.Items.Add(new VoucherItem { AccountName = "Sales Account", Debit = 0, Credit = netSales, Particulars = "Net Sales" });

                if (invoice.IGST > 0)
                    salesVoucher.Items.Add(new VoucherItem { AccountName = "IGST Account", Debit = 0, Credit = invoice.IGST, Particulars = "IGST Output" });
                else
                {
                    if (invoice.CGST > 0) salesVoucher.Items.Add(new VoucherItem { AccountName = "CGST Account", Debit = 0, Credit = invoice.CGST, Particulars = "CGST Output" });
                    if (invoice.SGST > 0) salesVoucher.Items.Add(new VoucherItem { AccountName = "SGST Account", Debit = 0, Credit = invoice.SGST, Particulars = "SGST Output" });
                }

                _context.Vouchers.Add(salesVoucher);

                // 5. ACCOUNTING: Receipt Voucher (Debit Cash/Bank, Credit Customer)
                if (invoice.PaidAmount > 0)
                {
                    var receiptVoucher = new Voucher
                    {
                        VoucherNo = $"REC-{invoice.InvoiceNo}",
                        Date = invoice.Date,
                        Type = VoucherType.CashReceipt,
                        AccountName = customerName,
                        Amount = invoice.PaidAmount,
                        Particulars = $"Payment received for Inv: {invoice.InvoiceNo}"
                    };

                    string drAccount = (invoice.PaymentMode == "Bank" || invoice.PaymentMode == "Card" || invoice.PaymentMode == "UPI") ? "Bank A/c" : "Cash in Hand";
                    
                    receiptVoucher.Items.Add(new VoucherItem { AccountName = drAccount, Debit = invoice.PaidAmount, Credit = 0, Particulars = $"Via {invoice.PaymentMode}" });
                    receiptVoucher.Items.Add(new VoucherItem { AccountName = customerName, Debit = 0, Credit = invoice.PaidAmount, Particulars = "Paid by Customer" });

                    _context.Vouchers.Add(receiptVoucher);
                }

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
