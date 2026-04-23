using System.ComponentModel.DataAnnotations;

namespace JewelleryApp.Models.Jewellery
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;

        public string FullName { get; set; } = string.Empty;

        public string Role { get; set; } = "Admin"; // "Admin", "Staff"

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
