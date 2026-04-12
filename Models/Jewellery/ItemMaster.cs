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
        
        [Display(Name = "In Stock")]
        public int StockQuantity { get; set; }

        [Display(Name = "Category")]
        public string? Category { get; set; } // Gold, Silver, Diamond, etc.

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
