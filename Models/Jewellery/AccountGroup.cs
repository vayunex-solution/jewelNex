using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JewelleryApp.Models.Jewellery
{
    public enum AccountGroupType
    {
        Asset = 1,
        Liability = 2,
        Income = 3,
        Expenditure = 4
    }

    public class AccountGroup
    {
        public int Id { get; set; }

        [Required]
        [Display(Name = "Group Name")]
        public string Name { get; set; } = string.Empty;

        [Display(Name = "Under Group")]
        public int? ParentGroupId { get; set; }
        public AccountGroup? ParentGroup { get; set; }

        [Display(Name = "Position in Hierarchy")]
        public int PositionInHierarchy { get; set; }

        [Display(Name = "Is Sub Ledger")]
        public bool IsSubLedger { get; set; }

        public AccountGroupType Category { get; set; }

        public ICollection<AccountGroup> SubGroups { get; set; } = new List<AccountGroup>();
    }
}
