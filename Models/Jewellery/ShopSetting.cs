using System.ComponentModel.DataAnnotations;

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
    }
}
