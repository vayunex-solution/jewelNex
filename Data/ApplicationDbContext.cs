using Microsoft.EntityFrameworkCore;
using JewelleryApp.Models.Jewellery;

namespace JewelleryApp.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Customer> Customers { get; set; } = default!;
        public DbSet<Invoice> Invoices { get; set; } = default!;
        public DbSet<InvoiceItem> InvoiceItems { get; set; } = default!;
        public DbSet<ItemMaster> ItemsMaster { get; set; } = default!;
        public DbSet<ShopSetting> ShopSettings { get; set; } = default!;
        public DbSet<Voucher> Vouchers { get; set; } = default!;
        public DbSet<VoucherItem> VoucherItems { get; set; } = default!;
        public DbSet<AccountGroup> AccountGroups { get; set; } = default!;
        public DbSet<AccountHead> AccountHeads { get; set; } = default!;
        public DbSet<StockEntry> StockEntries { get; set; } = default!;
        public DbSet<User> Users { get; set; } = default!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure AccountGroup hierarchy
            modelBuilder.Entity<AccountGroup>()
                .HasOne(g => g.ParentGroup)
                .WithMany(g => g.SubGroups)
                .HasForeignKey(g => g.ParentGroupId)
                .OnDelete(DeleteBehavior.Restrict);

            // Seed Root Account Groups
            modelBuilder.Entity<AccountGroup>().HasData(
                new AccountGroup { Id = 1, Name = "ASSETS", Category = AccountGroupType.Asset, PositionInHierarchy = 1 },
                new AccountGroup { Id = 2, Name = "LIABILITIES", Category = AccountGroupType.Liability, PositionInHierarchy = 1 },
                new AccountGroup { Id = 3, Name = "INCOME", Category = AccountGroupType.Income, PositionInHierarchy = 1 },
                new AccountGroup { Id = 4, Name = "EXPENDITURE", Category = AccountGroupType.Expenditure, PositionInHierarchy = 1 }
            );

            // Configure decimal precision
            modelBuilder.Entity<InvoiceItem>()
                .Property(i => i.GrossWt).HasColumnType("decimal(10, 3)");
            
            modelBuilder.Entity<InvoiceItem>()
                .Property(i => i.NetWt).HasColumnType("decimal(10, 3)");

            modelBuilder.Entity<InvoiceItem>()
                .Property(i => i.FineWt).HasColumnType("decimal(10, 3)");

            // Seed default Items
            modelBuilder.Entity<ItemMaster>().HasData(
                // Gold Items (22K)
                new ItemMaster { Id = 1, Name = "Gold Ring", Category = "Gold", Purity = "22K", DefaultRate = 0, StockQuantity = 0 },
                new ItemMaster { Id = 2, Name = "Gold Chain", Category = "Gold", Purity = "22K", DefaultRate = 0, StockQuantity = 0 },
                new ItemMaster { Id = 3, Name = "Gold Bangle", Category = "Gold", Purity = "22K", DefaultRate = 0, StockQuantity = 0 },
                new ItemMaster { Id = 4, Name = "Gold Necklace", Category = "Gold", Purity = "22K", DefaultRate = 0, StockQuantity = 0 },
                new ItemMaster { Id = 5, Name = "Gold Earrings", Category = "Gold", Purity = "22K", DefaultRate = 0, StockQuantity = 0 },
                new ItemMaster { Id = 6, Name = "Gold Pendant", Category = "Gold", Purity = "22K", DefaultRate = 0, StockQuantity = 0 },
                new ItemMaster { Id = 7, Name = "Gold Mangalsutra", Category = "Gold", Purity = "22K", DefaultRate = 0, StockQuantity = 0 },
                new ItemMaster { Id = 8, Name = "Gold Nose Pin", Category = "Gold", Purity = "22K", DefaultRate = 0, StockQuantity = 0 },
                new ItemMaster { Id = 9, Name = "Gold Bracelet", Category = "Gold", Purity = "22K", DefaultRate = 0, StockQuantity = 0 },
                
                // Silver Items
                new ItemMaster { Id = 10, Name = "Silver Payal (Anklet)", Category = "Silver", Purity = "70%", DefaultRate = 0, StockQuantity = 0 },
                new ItemMaster { Id = 11, Name = "Silver Bichiya (Toe Ring)", Category = "Silver", Purity = "70%", DefaultRate = 0, StockQuantity = 0 },
                new ItemMaster { Id = 12, Name = "Silver Coin", Category = "Silver", Purity = "99%", DefaultRate = 0, StockQuantity = 0 },
                new ItemMaster { Id = 13, Name = "Silver Glass", Category = "Silver", Purity = "80%", DefaultRate = 0, StockQuantity = 0 },
                new ItemMaster { Id = 14, Name = "Silver Spoon", Category = "Silver", Purity = "80%", DefaultRate = 0, StockQuantity = 0 },
                new ItemMaster { Id = 15, Name = "Silver Idol", Category = "Silver", Purity = "80%", DefaultRate = 0, StockQuantity = 0 },
                new ItemMaster { Id = 16, Name = "Silver Chain", Category = "Silver", Purity = "70%", DefaultRate = 0, StockQuantity = 0 },
                new ItemMaster { Id = 17, Name = "Silver Bracelet", Category = "Silver", Purity = "70%", DefaultRate = 0, StockQuantity = 0 },
                new ItemMaster { Id = 18, Name = "Silver Ring", Category = "Silver", Purity = "70%", DefaultRate = 0, StockQuantity = 0 }
            );
        }
    }
}
