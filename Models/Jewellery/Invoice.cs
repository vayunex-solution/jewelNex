using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JewelleryApp.Models.Jewellery
{
    public class Invoice
    {
        public int Id { get; set; }

        [Required]
        [Display(Name = "Invoice Number")]
        public string InvoiceNo { get; set; } = string.Empty;

        [Required]
        [DataType(DataType.Date)]
        public DateTime Date { get; set; } = DateTime.Now;

        [Display(Name = "Customer")]
        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal GoldValueTotal { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal MakingChargesTotal { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal SubTotal { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal CGST { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal SGST { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal IGST { get; set; }

        [Column(TypeName = "decimal(5, 2)")]
        public decimal GstRate { get; set; } = 3.00m; // Total GST % (e.g. 3.00 for 1.5+1.5)

        [Column(TypeName = "decimal(18, 2)")]
        public decimal Discount { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal TotalAmount { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal RoundedOff { get; set; }

        [Display(Name = "Payment Mode")]
        public string PaymentMode { get; set; } = "Cash";

        [Column(TypeName = "decimal(18, 2)")]
        public decimal PaidAmount { get; set; }

        [NotMapped]
        public decimal BalanceAmount => TotalAmount - PaidAmount;

        public string? Remarks { get; set; }
        public string InvoiceType { get; set; } = "Tax Invoice"; // "Tax Invoice" or "Rough Estimate"
        public List<InvoiceItem> Items { get; set; } = new();
    }
}
