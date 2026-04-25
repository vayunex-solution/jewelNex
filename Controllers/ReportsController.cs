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
            var vouchers = await _context.VoucherItems.ToListAsync();
            var customers = await _context.Customers.ToListAsync();

            var summary = new ReportSummary
            {
                TotalCash = vouchers.Where(v => v.AccountName == "Cash A/c").Sum(v => v.Debit - v.Credit),
                TotalUPI = vouchers.Where(v => v.AccountName == "UPI A/c").Sum(v => v.Debit - v.Credit),
                TotalCard = vouchers.Where(v => v.AccountName == "Card A/c").Sum(v => v.Debit - v.Credit),
            };

            decimal totalOut = 0;
            foreach (var c in customers)
            {
                var custVouchers = vouchers.Where(v => v.AccountName == c.Name);
                decimal bal = c.BalanceType == BalanceType.Dr ? c.OpeningBalance : -c.OpeningBalance;
                foreach (var v in custVouchers) bal += (v.Debit - v.Credit);
                if (bal > 0) totalOut += bal;
            }
            summary.TotalOutstanding = totalOut;

            var pendingCustomers = new List<CustomerPendingBalance>();
            foreach (var c in customers)
            {
                var custVouchers = vouchers.Where(v => v.AccountName == c.Name).ToList();
                decimal bal = c.BalanceType == BalanceType.Dr ? c.OpeningBalance : -c.OpeningBalance;
                
                decimal billed = custVouchers.Sum(v => v.Debit);
                decimal paid = custVouchers.Sum(v => v.Credit);
                
                foreach (var v in custVouchers) bal += (v.Debit - v.Credit);
                
                if (bal > 0)
                {
                    pendingCustomers.Add(new CustomerPendingBalance
                    {
                        Name = c.Name,
                        Mobile = c.Mobile,
                        TotalBilled = billed,
                        TotalPaid = paid,
                        NetBalance = bal,
                        LastTransactionDate = custVouchers.Any() ? custVouchers.Max(v => v.Voucher?.Date ?? DateTime.MinValue) : DateTime.MinValue
                    });
                }
            }
            summary.PendingCustomers = pendingCustomers.OrderByDescending(x => x.NetBalance).ToList();

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
        public List<CustomerPendingBalance> PendingCustomers { get; set; } = new();
    }

    public class CustomerPendingBalance
    {
        public string Name { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public decimal TotalBilled { get; set; }
        public decimal TotalPaid { get; set; }
        public decimal NetBalance { get; set; }
        public DateTime LastTransactionDate { get; set; }
    }
}
