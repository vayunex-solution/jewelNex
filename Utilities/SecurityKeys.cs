using System;
using System.IO;
using System.Linq;
using System.Net.NetworkInformation;
using System.Security.Cryptography;
using System.Text;

namespace JewelleryApp.Utilities
{
    public static class SecurityKeys
    {
        private const string SALT = "JKS@PRO_ERPV5"; // Secret salt for hardware locking

        /// <summary>
        /// Generates a unique semi-stable ID for the current hardware.
        /// Uses the MAC Address of the primary network interface.
        /// </summary>
        public static string GetMachineId()
        {
            try
            {
                var nics = NetworkInterface.GetAllNetworkInterfaces();
                var mac = nics
                    .Where(nic => nic.OperationalStatus == OperationalStatus.Up && !nic.Description.Contains("Virtual"))
                    .OrderBy(nic => nic.Name) // Sort by name for stability
                    .Select(nic => nic.GetPhysicalAddress().ToString())
                    .FirstOrDefault();

                if (string.IsNullOrEmpty(mac))
                {
                    // Fallback to computer name + some system salt if no MAC found
                    return "JKS-UNQ-" + (Environment.MachineName.Length * 123).ToString("X4") + "-OFFLINE";
                }

                // Create a shorter, readable fingerprint (e.g. JKS-ABCD-1234)
                using (var sha = SHA256.Create())
                {
                    var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(mac + Environment.ProcessorCount));
                    var hex = BitConverter.ToString(hash).Replace("-", "");
                    return $"JKS-{hex.Substring(0, 4)}-{hex.Substring(8, 4)}-{hex.Substring(16, 4)}".ToUpper();
                }
            }
            catch
            {
                return "JKS-OFFLINE-ERROR";
            }
        }

        /// <summary>
        /// Generates the expected valid license key for a given machine ID and validity period.
        /// </summary>
        /// <param name="validityDays">Number of days from activation. 0 means Unlimited.</param>
        public static string GenerateLicenseKey(string machineId, int validityDays = 0)
        {
            if (string.IsNullOrEmpty(machineId)) return "";

            using (var sha = SHA256.Create())
            {
                // Key calculation includes validityDays in the hash for security
                var input = machineId.Trim().ToUpper() + SALT + validityDays;
                var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
                var hex = BitConverter.ToString(hash).Replace("-", "");
                
                // Formatted as XXXX-XXXX-XXXX-XXXX-VALIDITY
                var baseKey = $"{hex.Substring(0, 4)}-{hex.Substring(10, 4)}-{hex.Substring(20, 4)}-{hex.Substring(30, 4)}".ToUpper();
                return $"{baseKey}-{validityDays}";
            }
        }

        /// <summary>
        /// Validates if a user-provided key is correct and extracts its validity duration.
        /// Supports a universal MASTER_KEY for default trials/testing.
        /// </summary>
        public static (bool IsValid, int ValidityDays) VerifyKeyAndGetDays(string machineId, string providedKey)
        {
            if (string.IsNullOrEmpty(providedKey)) return (false, 0);

            // Clean the provided key: Remove spaces and make uppercase
            var cleanKey = providedKey.Replace(" ", "").Trim().ToUpper();

            // Universal Master Key Check (15-Day Trial)
            const string MASTER_KEY = "JKS-7777-8888-9999-0000-15";
            if (string.Equals(cleanKey, MASTER_KEY, StringComparison.OrdinalIgnoreCase))
            {
                return (true, 15);
            }

            if (string.IsNullOrEmpty(machineId)) return (false, 0);
            
            var parts = cleanKey.Split('-');
            if (parts.Length != 5) return (false, 0); // Format must be XXXX-XXXX-XXXX-XXXX-DAYS

            if (!int.TryParse(parts[4], out int days)) return (false, 0);

            // Generate what we expect for this machine and these days
            var expected = GenerateLicenseKey(machineId, days);
            bool isValid = string.Equals(expected.Replace(" ", "").Trim(), cleanKey, StringComparison.OrdinalIgnoreCase);
            
            return (isValid, days);
        }
    }
}
