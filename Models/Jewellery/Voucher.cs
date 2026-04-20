using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JewelleryApp.Models.Jewellery
{
    public enum VoucherType
    {
        General = 0,
        CashPayment = 1,
        CashReceipt = 2,
        CashVoucher = 3
    }

    public class Voucher
    {
        public int Id { get; set; }

        [Required]
        [Display(Name = "Voucher Number")]
        public string VoucherNo { get; set; } = string.Empty;

        [Required]
        [DataType(DataType.Date)]
        public DateTime Date { get; set; } = DateTime.Now;

        [Required]
        public VoucherType Type { get; set; }

        [Required]
        [Display(Name = "Account Name")]
        public string AccountName { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal Amount { get; set; }

        public string? Particulars { get; set; }

        public string? Remarks { get; set; }

        public List<VoucherItem> Items { get; set; } = new();
    }
}
