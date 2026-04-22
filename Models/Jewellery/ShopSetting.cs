using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JewelleryApp.Models.Jewellery
{
    public class ShopSetting
    {
        public int Id { get; set; }

        // Licensing Properties
        public string? LicenseKey { get; set; }
        public string? LastKnownMachineId { get; set; }
        public DateTime? ActivationDate { get; set; }
        public int ExpiryDays { get; set; } // 0 = Unlimited

        [Required]
        [Display(Name = "Shop Name")]
        public string ShopName { get; set; } = "JAIN JEWELLERS";

        [Display(Name = "Tagline")]
        public string? Tagline { get; set; } = "Deals in : All Types of Gold & Silver Jewellery";

        [Required]
        [Display(Name = "Address Line 1")]
        public string Address1 { get; set; } = "NEAR GURU RAVIDAS MANDIR";

        [Display(Name = "Address Line 2")]
        public string? Address2 { get; set; } = "KHALSA COLLEGE ROAD";

        [Display(Name = "City/State/Zip")]
        public string? CityState { get; set; } = "YAMUNA NAGAR -135001";

        [Display(Name = "Phone 1")]
        public string? Phone1 { get; set; } = "9896891036";

        [Display(Name = "Phone 2")]
        public string? Phone2 { get; set; } = "9996955557";

        [Display(Name = "GSTIN")]
        public string? GSTIN { get; set; } = "06AASPJ9552E1ZD";

        [Display(Name = "PAN")]
        public string? PAN { get; set; } = "AASPJ9552E";

        [Display(Name = "State Code")]
        public string? StateCode { get; set; } = "06";

        [Display(Name = "Bank Name")]
        public string? BankName { get; set; } = "Bank of Maharashtra";

        [Display(Name = "Bank Branch")]
        public string? BankBranch { get; set; } = "Near Lal Dwara, Jagadhri Road, Ynr.";

        [Display(Name = "Account Number")]
        public string? AccountNo { get; set; } = "60550126417";

        [Display(Name = "IFSC Code")]
        public string? IFSCCode { get; set; } = "MAHB0001309";

        // ─── Bill Setting Properties ───
        [Display(Name = "Use Purity (Advanced Billing)")]
        public bool UsePurity { get; set; } = true; // false = Simple Billing (Gross Wt × Rate)

        [Display(Name = "Show Metal Column")]
        public bool ShowMetalColumn { get; set; } = true;

        [Display(Name = "Show Purity Column")]
        public bool ShowPurityColumn { get; set; } = true;

        [Display(Name = "Show Fine Weight Column")]
        public bool ShowFineWtColumn { get; set; } = true;

        [Display(Name = "Show Rate Column")]
        public bool ShowRateColumn { get; set; } = true;

        [Display(Name = "Show Metal Amount Column")]
        public bool ShowMetalAmountColumn { get; set; } = true;

        [Display(Name = "Show Making % Column")]
        public bool ShowMakingPercentColumn { get; set; } = true;

        [Display(Name = "Show Making Amount Column")]
        public bool ShowMakingAmountColumn { get; set; } = true;

        [Display(Name = "Making Charge Type")]
        public string MakingChargeType { get; set; } = "Percentage"; // "Percentage" or "Flat"

        [Display(Name = "Default Gold Rate (₹/g)")]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal DefaultGoldRate { get; set; } = 6200;

        [Display(Name = "Default Silver Rate (₹/g)")]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal DefaultSilverRate { get; set; } = 80;

        [Display(Name = "Default Making %")]
        [Column(TypeName = "decimal(5, 2)")]
        public decimal DefaultMakingPercent { get; set; } = 10;
    }
}
