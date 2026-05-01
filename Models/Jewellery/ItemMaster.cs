using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JewelleryApp.Models.Jewellery
{
    public class ItemMaster
    {
        public int Id { get; set; }

        [Required]
        [Display(Name = "Item Name")]
        public string Name { get; set; } = string.Empty;

        [Display(Name = "Default Rate (₹/g)")]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal DefaultRate { get; set; }

        public string? Purity { get; set; } // 22K, 18K, etc.
        
        [Display(Name = "In Stock (Qty)")]
        public int StockQuantity { get; set; }

        [Display(Name = "Opening Qty")]
        public int OpeningStock { get; set; } = 0;

        [Display(Name = "Opening Weight (g)")]
        [Column(TypeName = "decimal(18, 3)")]
        public decimal OpeningWeight { get; set; } = 0;

        [Display(Name = "Total Weight (g)")]
        [Column(TypeName = "decimal(18, 3)")]
        public decimal TotalWeight { get; set; } = 0;

        [Display(Name = "Category")]
        public string? Category { get; set; } // Gold, Silver, Diamond, etc.

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
