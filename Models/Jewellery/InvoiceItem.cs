using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JewelleryApp.Models.Jewellery
{
    public class InvoiceItem
    {
        public int Id { get; set; }

        public int InvoiceId { get; set; }
        public Invoice? Invoice { get; set; }

        [Required]
        [Display(Name = "Item Name")]
        public string ItemName { get; set; } = string.Empty;

        public string? HUID { get; set; }
        public string? Purity { get; set; }

        [Display(Name = "Gross Weight (g)")]
        [Column(TypeName = "decimal(10, 3)")]
        public decimal GrossWt { get; set; }

        [Display(Name = "Net Weight (g)")]
        [Column(TypeName = "decimal(10, 3)")]
        public decimal NetWt { get; set; }

        [Display(Name = "Rate (₹/g)")]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal Rate { get; set; }

        [Display(Name = "Making Charges")]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal MakingCharges { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal Amount { get; set; }
    }
}
