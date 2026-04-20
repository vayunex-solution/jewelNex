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
                    bool isReceipt = voucher.Type == VoucherType.CashReceipt;
                    
                    // Side 1: The Account (Customer or Expense)
                    voucher.Items.Add(new VoucherItem { 
                        AccountName = voucher.AccountName, 
                        Debit = isReceipt ? 0 : voucher.Amount, 
                        Credit = isReceipt ? voucher.Amount : 0,
                        Particulars = voucher.Particulars
                    });

                    // Side 2: Cash/Bank Account (Auto-Post)
                    string cashBankAcc = voucher.Type.ToString().Contains("Cash") ? "Cash in Hand" : "Bank A/c";
                    voucher.Items.Add(new VoucherItem { 
                        AccountName = cashBankAcc, 
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

        public async Task<IActionResult> AccountStatement(string? accountId, DateTime? fromDate, DateTime? toDate)
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
                        OpeningBalance = 0, // Customers start with 0 unless we add the field to model
                        BalanceType = BalanceType.Dr
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

            // Get Vouchers for this account (matching AccountName)
            var vouchers = await _context.Vouchers
                .Where(v => v.AccountName == targetName && v.Date <= to)
                .ToListAsync();

            // Calculate Opening Balance at 'from' date
            decimal runningBal = targetAccount.BalanceType == BalanceType.Dr ? targetAccount.OpeningBalance : -targetAccount.OpeningBalance;
            
            var preTransactions = vouchers.Where(v => v.Date < from);
            foreach (var v in preTransactions)
            {
                // Simple logic: determine Dr/Cr based on common patterns if manual items are missing
                // In a robust system, we would iterate over VoucherItems
                bool isDr = (v.Type == VoucherType.CashPayment || v.Type == VoucherType.General || v.Type == VoucherType.CashVoucher);
                decimal amt = isDr ? v.Amount : -v.Amount;
                runningBal += amt;
            }

            vm.OpeningBalance = Math.Abs(runningBal);
            vm.OpeningBalanceType = runningBal >= 0 ? BalanceType.Dr : BalanceType.Cr;

            // Current Transactions
            var currentVouchers = vouchers.Where(v => v.Date >= from && v.Date <= to).OrderBy(v => v.Date);
            foreach (var v in currentVouchers)
            {
                bool isDr = (v.Type == VoucherType.CashPayment || v.Type == VoucherType.General || v.Type == VoucherType.CashVoucher);
                decimal debit = isDr ? v.Amount : 0;
                decimal credit = isDr ? 0 : v.Amount;
                
                runningBal += (debit - credit);

                vm.Entries.Add(new LedgerEntry
                {
                    VoucherNo = v.VoucherNo,
                    Date = v.Date,
                    Description = v.Particulars ?? v.Type.ToString(),
                    Debit = debit,
                    Credit = credit,
                    RunningBalance = Math.Abs(runningBal),
                    BalanceType = runningBal >= 0 ? BalanceType.Dr : BalanceType.Cr
                });
            }

            vm.ClosingBalance = Math.Abs(runningBal);
            vm.ClosingBalanceType = runningBal >= 0 ? BalanceType.Dr : BalanceType.Cr;

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
                _ => "VO"
            };
            return $"{prefix}-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}";
        }
    }
}
