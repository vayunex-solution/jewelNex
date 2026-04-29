using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JewelleryApp.Data;
using JewelleryApp.Models.Jewellery;

namespace JewelleryApp.Controllers
{
    public class CustomersController : Controller
    {
        private readonly ApplicationDbContext _context;

        public CustomersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: Customers
        public async Task<IActionResult> Index()
        {
            return View(await _context.Customers.OrderBy(x => x.Name).ToListAsync());
        }

        // GET: Customers/Create
        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("Name,Mobile,Address,StateCode,OpeningBalance,OpeningGold,OpeningSilver,BalanceType,GoldBalanceType,SilverBalanceType")] Customer customer)
        {
            if (ModelState.IsValid)
            {
                // Auto-generate Customer Code based on Max ID
                int maxId = await _context.Customers.AnyAsync() ? await _context.Customers.MaxAsync(c => c.Id) : 0;
                customer.CustomerCode = $"CUST{(maxId + 1):D4}";
                
                _context.Add(customer);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(customer);
        }

        [HttpGet]
        public async Task<JsonResult> GetAllCustomers()
        {
            var customers = await _context.Customers
                .Select(x => new { 
                    id = x.Id, 
                    name = x.Name, 
                    mobile = x.Mobile, 
                    address = x.Address, 
                    stateCode = x.StateCode,
                    openingBalance = x.OpeningBalance,
                    openingGold = x.OpeningGold,
                    openingSilver = x.OpeningSilver,
                    balanceType = (int)x.BalanceType,
                    goldBalanceType = (int)x.GoldBalanceType,
                    silverBalanceType = (int)x.SilverBalanceType
                })
                .ToListAsync();
            return Json(customers);
        }

        [HttpGet]
        public async Task<IActionResult> GetCustomerBalance(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return NotFound();

            // 1. Calculate Amount Balance (Opening + Vouchers)
            // Note: Invoices also create vouchers, so this covers everything
            var voucherItems = await _context.VoucherItems
                .Include(vi => vi.Voucher)
                .Where(vi => vi.AccountName == customer.Name)
                .ToListAsync();

            decimal amountBal = customer.BalanceType == BalanceType.Dr ? customer.OpeningBalance : -customer.OpeningBalance;
            foreach (var vi in voucherItems) amountBal += (vi.Debit - vi.Credit);

            // 2. Calculate Metal Balance (Opening + InvoiceItems + Metal Vouchers)
            var invoiceItems = await _context.InvoiceItems
                .Include(ii => ii.Invoice)
                .Where(ii => ii.Invoice.CustomerId == id)
                .ToListAsync();

            var metalVouchers = await _context.Vouchers
                .Where(v => v.AccountName == customer.Name && (v.Type == VoucherType.MetalReceipt || v.Type == VoucherType.MetalPayment))
                .ToListAsync();

            decimal goldBal = customer.GoldBalanceType == BalanceType.Dr ? customer.OpeningGold : -customer.OpeningGold;
            decimal silverBal = customer.SilverBalanceType == BalanceType.Dr ? customer.OpeningSilver : -customer.OpeningSilver;

            // From Invoices
            foreach (var item in invoiceItems)
            {
                if (item.Metal == "Gold")
                {
                    if (item.RI == "I") goldBal += item.FineWt;
                    else goldBal -= item.FineWt;
                }
                else if (item.Metal == "Silver")
                {
                    if (item.RI == "I") silverBal += item.FineWt;
                    else silverBal -= item.FineWt;
                }
            }

            // From Invoice Level Metal Receipt & Bhav Cut
            var invoiceReceipts = await _context.Invoices
                .Where(i => i.CustomerId == id && (i.MetalReceivedFineWeight > 0 || i.BhavCutWeight > 0))
                .ToListAsync();
 
            foreach (var inv in invoiceReceipts)
            {
                // Metal Received
                if (inv.MetalReceivedType == "Gold") goldBal -= inv.MetalReceivedFineWeight;
                else if (inv.MetalReceivedType == "Silver") silverBal -= inv.MetalReceivedFineWeight;

                // Bhav Cut (Cash to Metal Conversion)
                if (inv.BhavCutWeight > 0)
                {
                    if (inv.BhavCutMetalType == "Gold") goldBal -= inv.BhavCutWeight;
                    else if (inv.BhavCutMetalType == "Silver") silverBal -= inv.BhavCutWeight;
                }
            }

            // From Vouchers
            foreach (var v in metalVouchers)
            {
                if (v.Metal == "Gold")
                {
                    if (v.Type == VoucherType.MetalPayment) goldBal += v.FineWeight; // We issued gold to them
                    else goldBal -= v.FineWeight; // We received gold from them
                }
                else if (v.Metal == "Silver")
                {
                    if (v.Type == VoucherType.MetalPayment) silverBal += v.FineWeight;
                    else silverBal -= v.FineWeight;
                }
            }

            return Ok(new
            {
                amount = Math.Abs(amountBal),
                amountType = amountBal >= 0 ? "Dr" : "Cr",
                gold = goldBal,
                silver = silverBal
            });
        }

        // GET: Customers/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return NotFound();
            return View(customer);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("Id,Name,Mobile,Address,StateCode,OpeningBalance,OpeningGold,OpeningSilver,BalanceType,GoldBalanceType,SilverBalanceType,CustomerCode,CreatedAt")] Customer customer)
        {
            if (id != customer.Id) return NotFound();

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(customer);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!_context.Customers.Any(e => e.Id == customer.Id)) return NotFound();
                    else throw;
                }
                return RedirectToAction(nameof(Index));
            }
            return View(customer);
        }

        // Delete (Simplified)
        public async Task<IActionResult> Delete(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer != null)
            {
                _context.Customers.Remove(customer);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }
    }
}
