using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using JewelleryApp.Data;
using JewelleryApp.Models.Jewellery;
using JewelleryApp.Models.ViewModels;

namespace JewelleryApp.Controllers
{
    public class AccountingController : Controller
    {
        private readonly ApplicationDbContext _context;

        public AccountingController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAccountBalance(string name)
        {
            if (string.IsNullOrEmpty(name)) return BadRequest();

            // 1. Try Customer
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Name == name);
            if (customer != null)
            {
                // Use the same logic as AccountStatement
                var items = await _context.VoucherItems
                    .Include(vi => vi.Voucher)
                    .Where(vi => vi.AccountName == name)
                    .ToListAsync();

                decimal bal = customer.BalanceType == BalanceType.Dr ? customer.OpeningBalance : -customer.OpeningBalance;
                foreach (var vi in items) bal += (vi.Debit - vi.Credit);

                return Ok(new { balance = Math.Abs(bal), type = bal >= 0 ? "Dr" : "Cr" });
            }

            // 2. Try Account Head
            var head = await _context.AccountHeads.FirstOrDefaultAsync(h => h.Name == name);
            if (head != null)
            {
                var items = await _context.VoucherItems
                    .Include(vi => vi.Voucher)
                    .Where(vi => vi.AccountName == name)
                    .ToListAsync();

                decimal bal = head.BalanceType == BalanceType.Dr ? head.OpeningBalance : -head.OpeningBalance;
                foreach (var vi in items) bal += (vi.Debit - vi.Credit);

                return Ok(new { balance = Math.Abs(bal), type = bal >= 0 ? "Dr" : "Cr" });
            }

            return NotFound();
        }

        // GET: Accounting
        public async Task<IActionResult> Index()
        {
            var vouchers = await _context.Vouchers.OrderByDescending(v => v.Date).ToListAsync();
            return View(vouchers);
        }

        public async Task<IActionResult> Create(VoucherType type)
        {
            ViewBag.VoucherType = type;
            
            // Fetch Account Heads and Customers for suggestions
            var accountNames = await _context.AccountHeads.Select(a => a.Name).ToListAsync();
            var customerNames = await _context.Customers.Select(c => c.Name).ToListAsync();
            
            var allNames = accountNames.Concat(customerNames).Distinct().OrderBy(n => n).ToList();
            ViewBag.AccountSuggestions = allNames;

            var voucher = new Voucher 
            { 
                Type = type,
                Date = DateTime.Now,
                VoucherNo = GenerateVoucherNo(type)
            };
            return View(voucher);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Voucher voucher)
        {
            if (ModelState.IsValid)
            {
                // If it's a simple entry without items, create double entry automatically (Point 4, 5)
                if (voucher.Items == null || !voucher.Items.Any())
                {
                    bool isReceipt = voucher.Type == VoucherType.CashReceipt || voucher.Type == VoucherType.MetalReceipt;
                    bool isMetal = voucher.Type == VoucherType.MetalReceipt || voucher.Type == VoucherType.MetalPayment;

                    // Side 1: The Account (Customer or Expense)
                    voucher.Items.Add(new VoucherItem { 
                        AccountName = voucher.AccountName, 
                        Debit = isReceipt ? 0 : voucher.Amount, 
                        Credit = isReceipt ? voucher.Amount : 0,
                        Particulars = voucher.Particulars
                    });

                    // Side 2: Cash/Bank/Metal Account (Auto-Post)
                    string contraAcc = "Cash A/c";
                    if (voucher.Type.ToString().Contains("Bank")) contraAcc = "Bank A/c";
                    else if (isMetal) contraAcc = voucher.Metal == "Silver" ? "Silver Stock A/c" : "Gold Stock A/c";

                    voucher.Items.Add(new VoucherItem { 
                        AccountName = contraAcc, 
                        Debit = isReceipt ? voucher.Amount : 0, 
                        Credit = isReceipt ? 0 : voucher.Amount,
                        Particulars = $"Auto-posted from {voucher.Type}"
                    });
                }

                _context.Add(voucher);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(voucher);
        }

        public async Task<IActionResult> Details(int? id)
        {
            if (id == null) return NotFound();
            var voucher = await _context.Vouchers.FirstOrDefaultAsync(m => m.Id == id);
            if (voucher == null) return NotFound();
            return View(voucher);
        }

        public async Task<IActionResult> AccountStatement(string? accountId, DateTime? fromDate, DateTime? toDate, string? printOption)
        {
            var accountsList = await _context.AccountHeads.OrderBy(a => a.Name).ToListAsync();
            var customersList = await _context.Customers.OrderBy(c => c.Name).ToListAsync();

            var mergedList = new List<SelectListItem>();
            mergedList.Add(new SelectListItem { Text = "--- General Accounts ---", Value = "", Disabled = true });
            foreach (var acc in accountsList)
                mergedList.Add(new SelectListItem { Text = acc.Name, Value = "ACC_" + acc.Id, Selected = (accountId == "ACC_" + acc.Id) });

            mergedList.Add(new SelectListItem { Text = "--- Customers ---", Value = "", Disabled = true });
            foreach (var cust in customersList)
                mergedList.Add(new SelectListItem { Text = cust.Name, Value = "CUST_" + cust.Id, Selected = (accountId == "CUST_" + cust.Id) });

            ViewBag.Accounts = mergedList;

            if (string.IsNullOrEmpty(accountId)) return View();

            var from = fromDate ?? new DateTime(DateTime.Now.Year, 4, 1);
            var to = toDate ?? DateTime.Now.Date;

            AccountHead? targetAccount = null;
            string targetName = "";

            if (accountId.StartsWith("ACC_"))
            {
                int id = int.Parse(accountId.Replace("ACC_", ""));
                targetAccount = await _context.AccountHeads.Include(a => a.AccountGroup).FirstOrDefaultAsync(a => a.Id == id);
                if (targetAccount != null) targetName = targetAccount.Name;
            }
            else if (accountId.StartsWith("CUST_"))
            {
                int id = int.Parse(accountId.Replace("CUST_", ""));
                var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == id);
                if (customer != null)
                {
                    targetName = customer.Name;
                    targetAccount = new AccountHead
                    {
                        Name = customer.Name,
                        AccountGroup = new AccountGroup { Name = "Sundry Debtors (Customers)" },
                        Description = $"Statement for Customer: {customer.Name} | Mobile: {customer.Mobile}",
                        OpeningBalance = customer.OpeningBalance,
                        BalanceType = customer.BalanceType
                    };
                }
            }

            if (targetAccount == null) return NotFound();

            var vm = new AccountStatementViewModel
            {
                Account = targetAccount,
                FromDate = from,
                ToDate = to,
                OpeningBalance = targetAccount.OpeningBalance,
                OpeningBalanceType = targetAccount.BalanceType
            };

            // Get VoucherItems for this account (matching AccountName)
            var voucherItems = await _context.VoucherItems
                .Include(vi => vi.Voucher)
                .Where(vi => vi.AccountName == targetName && vi.Voucher.Date <= to)
                .ToListAsync();

            // Calculate Opening Balance at 'from' date
            decimal runningBal = vm.OpeningBalanceType == BalanceType.Dr ? vm.OpeningBalance : -vm.OpeningBalance;
            
            var preTransactions = voucherItems.Where(vi => vi.Voucher.Date < from);
            foreach (var vi in preTransactions)
            {
                runningBal += (vi.Debit - vi.Credit);
            }

            vm.OpeningBalance = Math.Abs(runningBal);
            vm.OpeningBalanceType = runningBal >= 0 ? BalanceType.Dr : BalanceType.Cr;

            // Current Transactions
            var currentItems = voucherItems
                .Where(vi => vi.Voucher.Date >= from && vi.Voucher.Date <= to)
                .OrderBy(vi => vi.Voucher.Date)
                .ThenBy(vi => vi.Voucher.Id);

            foreach (var vi in currentItems)
            {
                runningBal += (vi.Debit - vi.Credit);

                string desc = vi.Particulars ?? vi.Voucher.Particulars ?? vi.Voucher.Type.ToString();
                if (vi.Voucher.Type == VoucherType.MetalReceipt || vi.Voucher.Type == VoucherType.MetalPayment)
                {
                    string typeLabel = vi.Voucher.Type == VoucherType.MetalReceipt ? "Metal Received" : "Metal Issued";
                    desc = $"{typeLabel}: {vi.Voucher.FineWeight:N3}g {vi.Voucher.Metal} ({vi.Voucher.Weight:N3}g @ {vi.Voucher.Purity}%)";
                    if (!string.IsNullOrEmpty(vi.Voucher.Particulars)) desc += $" - {vi.Voucher.Particulars}";
                }

                vm.Entries.Add(new LedgerEntry
                {
                    VoucherNo = vi.Voucher.VoucherNo,
                    Date = vi.Voucher.Date,
                    Description = desc,
                    Debit = vi.Debit,
                    Credit = vi.Credit,
                    RunningBalance = Math.Abs(runningBal),
                    BalanceType = runningBal >= 0 ? BalanceType.Dr : BalanceType.Cr,
                    MetalWeight = vi.Voucher.FineWeight,
                    MetalType = vi.Voucher.Metal
                });
            }

            vm.ClosingBalance = Math.Abs(runningBal);
            vm.ClosingBalanceType = runningBal >= 0 ? BalanceType.Dr : BalanceType.Cr;
            vm.PrintOption = printOption ?? "None";

            // Calculate Metal Balances if requested
            if (vm.PrintOption == "Weight" || vm.PrintOption == "Both")
            {
                if (accountId.StartsWith("CUST_"))
                {
                    int custId = int.Parse(accountId.Replace("CUST_", ""));
                    var customer = await _context.Customers.FindAsync(custId);
                    if (customer != null)
                    {
                        // 1. Calculate Opening Metal Balance (before fromDate)
                        var preInvoiceItems = await _context.InvoiceItems
                            .Include(ii => ii.Invoice)
                            .Where(ii => ii.Invoice.CustomerId == custId && ii.Invoice.Date < from)
                            .ToListAsync();
                        
                        var preMetalVouchers = await _context.Vouchers
                            .Where(v => v.AccountName == customer.Name && (v.Type == VoucherType.MetalReceipt || v.Type == VoucherType.MetalPayment) && v.Date < from)
                            .ToListAsync();

                        decimal preGold = customer.GoldBalanceType == BalanceType.Dr ? customer.OpeningGold : -customer.OpeningGold;
                        decimal preSilver = customer.SilverBalanceType == BalanceType.Dr ? customer.OpeningSilver : -customer.OpeningSilver;
                        
                        foreach (var item in preInvoiceItems)
                        {
                            if (item.Metal == "Gold") { if (item.RI == "I") preGold += item.FineWt; else preGold -= item.FineWt; }
                            else if (item.Metal == "Silver") { if (item.RI == "I") preSilver += item.FineWt; else preSilver -= item.FineWt; }
                        }
                        foreach (var v in preMetalVouchers)
                        {
                            if (v.Metal == "Gold") { if (v.Type == VoucherType.MetalPayment) preGold += v.FineWeight; else preGold -= v.FineWeight; }
                            else if (v.Metal == "Silver") { if (v.Type == VoucherType.MetalPayment) preSilver += v.FineWeight; else preSilver -= v.FineWeight; }
                        }
                        
                        vm.OpeningGold = preGold;
                        vm.OpeningSilver = preSilver;

                        // 2. Calculate Current Period Metal Transactions
                        var periodInvoiceItems = await _context.InvoiceItems
                            .Include(ii => ii.Invoice)
                            .Where(ii => ii.Invoice.CustomerId == custId && ii.Invoice.Date >= from && ii.Invoice.Date <= to)
                            .ToListAsync();

                        var periodMetalVouchers = await _context.Vouchers
                            .Where(v => v.AccountName == customer.Name && (v.Type == VoucherType.MetalReceipt || v.Type == VoucherType.MetalPayment) && v.Date >= from && v.Date <= to)
                            .ToListAsync();

                        decimal periodGold = 0;
                        decimal periodSilver = 0;
                        foreach (var item in periodInvoiceItems)
                        {
                            if (item.Metal == "Gold") { if (item.RI == "I") periodGold += item.FineWt; else periodGold -= item.FineWt; }
                            else if (item.Metal == "Silver") { if (item.RI == "I") periodSilver += item.FineWt; else periodSilver -= item.FineWt; }
                        }
                        foreach (var v in periodMetalVouchers)
                        {
                            if (v.Metal == "Gold") { if (v.Type == VoucherType.MetalPayment) periodGold += v.FineWeight; else periodGold -= v.FineWeight; }
                            else if (v.Metal == "Silver") { if (v.Type == VoucherType.MetalPayment) periodSilver += v.FineWeight; else periodSilver -= v.FineWeight; }
                        }
                        
                        vm.ClosingGold = vm.OpeningGold + periodGold;
                        vm.ClosingSilver = vm.OpeningSilver + periodSilver;
                        vm.TotalWeight = periodInvoiceItems.Sum(ii => ii.NetWt);
                    }
                }
            }

            return View(vm);
        }

        private string GenerateVoucherNo(VoucherType type)
        {
            string prefix = type switch
            {
                VoucherType.General => "GV",
                VoucherType.CashPayment => "CP",
                VoucherType.CashReceipt => "CR",
                VoucherType.CashVoucher => "CV",
                VoucherType.MetalReceipt => "MR",
                VoucherType.MetalPayment => "MP",
                _ => "VO"
            };
            return $"{prefix}-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}";
        }
    }
}
