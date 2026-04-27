using JewelleryApp.Models.Jewellery;

namespace JewelleryApp.Models.ViewModels
{
    public class LedgerEntry
    {
        public string VoucherNo { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
        public decimal RunningBalance { get; set; }
        public BalanceType BalanceType { get; set; }
        public decimal MetalWeight { get; set; }
        public string? MetalType { get; set; }
    }

    public class AccountStatementViewModel
    {
        public AccountHead Account { get; set; }
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public decimal OpeningBalance { get; set; }
        public BalanceType OpeningBalanceType { get; set; }
        public List<LedgerEntry> Entries { get; set; } = new();
        public decimal TotalDebit => Entries.Sum(e => e.Debit);
        public decimal TotalCredit => Entries.Sum(e => e.Credit);
        public decimal ClosingBalance { get; set; }
        public BalanceType ClosingBalanceType { get; set; }
        public string PrintOption { get; set; } = "None";
        public decimal TotalWeight { get; set; }

        public decimal OpeningGold { get; set; }
        public decimal OpeningSilver { get; set; }
        public decimal ClosingGold { get; set; }
        public decimal ClosingSilver { get; set; }
    }
}
