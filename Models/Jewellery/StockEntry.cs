using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JewelleryApp.Models.Jewellery
{
    public enum StockEntryType
    {
        Purchase = 1,
        Production = 2,
        IssueSlip = 3,
        SalesReturn = 4,
        InvoiceIssue = 5
    }

    public class StockEntry
    {
        public int Id { get; set; }

        [Required]
        [Display(Name = "Ref No")]
        public string ReferenceNo { get; set; } = string.Empty;

        [Required]
        public DateTime Date { get; set; } = DateTime.Now;

        [Required]
        public StockEntryType Type { get; set; }

        [Required]
        public int ItemMasterId { get; set; }
        public ItemMaster? Item { get; set; }

        public int Quantity { get; set; } // + for In, - for Out

        [Column(TypeName = "decimal(18, 3)")]
        public decimal Weight { get; set; } // + for In, - for Out

        public string? Remarks { get; set; }
    }
}
