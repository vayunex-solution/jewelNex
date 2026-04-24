using System.ComponentModel.DataAnnotations;

namespace JewelleryApp.Models.Jewellery
{
    public class BulkStockEntryViewModel
    {
        [Required]
        public string ReferenceNo { get; set; } = string.Empty;
        
        [Required]
        public DateTime Date { get; set; } = DateTime.Now;
        
        public string? Remarks { get; set; }
        
        public List<BulkItemEntry> Items { get; set; } = new();
    }

    public class BulkItemEntry
    {
        public int ItemId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public bool IsSelected { get; set; }
        public int Quantity { get; set; }
        public decimal Weight { get; set; }
    }
}
