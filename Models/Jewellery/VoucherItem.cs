using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JewelleryApp.Models.Jewellery
{
    public class VoucherItem
    {
        public int Id { get; set; }
        public int VoucherId { get; set; }
        public Voucher? Voucher { get; set; }

        public string AccountName { get; set; } = string.Empty;
        public int? AccountHeadId { get; set; }
        public AccountHead? AccountHead { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal Debit { get; set; }
        
        [Column(TypeName = "decimal(18, 2)")]
        public decimal Credit { get; set; }

        public string? Particulars { get; set; }
    }
}
