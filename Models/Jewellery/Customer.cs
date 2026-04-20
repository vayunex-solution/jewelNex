using System.ComponentModel.DataAnnotations;

namespace JewelleryApp.Models.Jewellery
{
    public class Customer
    {
        public int Id { get; set; }
        
        [Required]
        [Display(Name = "Customer Name")]
        public string Name { get; set; } = string.Empty;

        [Display(Name = "Mobile Number")]
        public string? Mobile { get; set; }

        [Required]
        [Display(Name = "Customer Code")]
        public string CustomerCode { get; set; } = string.Empty;

        [Display(Name = "State Code")]
        public string? StateCode { get; set; }

        public string? Address { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public List<Invoice> Invoices { get; set; } = new();
    }
}
