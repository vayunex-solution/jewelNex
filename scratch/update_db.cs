using System;
using Microsoft.Data.Sqlite;

namespace DbUpdate
{
    class Program
    {
        static void Main(string[] args)
        {
            string dbPath = "jewellery_v5.db";
            string connString = $"Data Source={dbPath}";
            
            try 
            {
                using (var connection = new SqliteConnection(connString))
                {
                    connection.Open();
                    
                    Console.WriteLine("Updating Customers table...");
                    
                    // Add OpeningBalance
                    try {
                        var cmd = connection.CreateCommand();
                        cmd.CommandText = "ALTER TABLE Customers ADD COLUMN OpeningBalance TEXT NOT NULL DEFAULT '0'";
                        cmd.ExecuteNonQuery();
                        Console.WriteLine("Added OpeningBalance column.");
                    } catch (Exception ex) { Console.WriteLine("OpeningBalance: " + ex.Message); }

                    // Add BalanceType
                    try {
                        var cmd = connection.CreateCommand();
                        cmd.CommandText = "ALTER TABLE Customers ADD COLUMN BalanceType INTEGER NOT NULL DEFAULT 1";
                        cmd.ExecuteNonQuery();
                        Console.WriteLine("Added BalanceType column.");
                    } catch (Exception ex) { Console.WriteLine("BalanceType: " + ex.Message); }
                    
                    connection.Close();
                }
                Console.WriteLine("Database update completed.");
            }
            catch (Exception ex)
            {
                Console.WriteLine("FATAL ERROR: " + ex.Message);
            }
        }
    }
}
