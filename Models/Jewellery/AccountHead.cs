using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JewelleryApp.Models.Jewellery
{
    public enum BalanceType
    {
        Dr = 1,
        Cr = 2
    }

    public class AccountHead
    {
        public int Id { get; set; }

        [Required]
        [Display(Name = "Account Name")]
        public string Name { get; set; } = string.Empty;

        [Required]
        [Display(Name = "Account Code")]
        public string AccountCode { get; set; } = string.Empty;

        [Required]
        [Display(Name = "Under Group")]
        public int AccountGroupId { get; set; }
        public AccountGroup? AccountGroup { get; set; }

        [Required]
        [Display(Name = "Opening Balance")]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal OpeningBalance { get; set; } = 0;

        [Required]
        public BalanceType BalanceType { get; set; } = BalanceType.Dr;

        [Display(Name = "Description")]
        public string? Description { get; set; }
    }
}
