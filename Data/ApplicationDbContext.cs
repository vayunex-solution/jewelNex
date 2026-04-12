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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure decimal precision for SQLite (though SQLite is dynamic, it's good practice)
            modelBuilder.Entity<InvoiceItem>()
                .Property(i => i.GrossWt).HasColumnType("decimal(10, 3)");
            
            modelBuilder.Entity<InvoiceItem>()
                .Property(i => i.NetWt).HasColumnType("decimal(10, 3)");
        }
    }
}
