using Microsoft.EntityFrameworkCore;
using JewelleryApp.Data;
using JewelleryApp.Models.Jewellery;
using System.Collections.Generic;
using System.Linq;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    context.Database.EnsureCreated();
    
    // Manual migration for columns if they don't exist
    try
    {
        context.Database.ExecuteSqlRaw("ALTER TABLE Invoices ADD COLUMN Discount decimal(18, 2) NOT NULL DEFAULT 0;");
    }
    catch { /* Column probably already exists */ }

    try
    {
        context.Database.ExecuteSqlRaw("ALTER TABLE Invoices ADD COLUMN IGST decimal(18, 2) NOT NULL DEFAULT 0;");
    }
    catch { /* Column probably already exists */ }

    // Ensure Vouchers table exists
    try
    {
        context.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS Vouchers (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                VoucherNo TEXT NOT NULL,
                Date TEXT NOT NULL,
                Type INTEGER NOT NULL,
                AccountName TEXT NOT NULL,
                Amount DECIMAL(18, 2) NOT NULL,
                Particulars TEXT,
                Remarks TEXT
            );");
    }
    catch { }

    // Ensure VoucherItems table exists
    try
    {
        context.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS VoucherItems (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                VoucherId INTEGER NOT NULL,
                AccountName TEXT NOT NULL,
                AccountHeadId INTEGER,
                Debit DECIMAL(18, 2) NOT NULL DEFAULT 0,
                Credit DECIMAL(18, 2) NOT NULL DEFAULT 0,
                Particulars TEXT,
                FOREIGN KEY (VoucherId) REFERENCES Vouchers(Id)
            );");
    }
    catch { }

    // Ensure ShopSettings table exists
    try
    {
        context.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS ShopSettings (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                ShopName TEXT NOT NULL,
                Tagline TEXT,
                Address1 TEXT NOT NULL,
                Address2 TEXT,
                CityState TEXT,
                Phone1 TEXT,
                Phone2 TEXT,
                GSTIN TEXT,
                PAN TEXT,
                StateCode TEXT,
                BankName TEXT,
                BankBranch TEXT,
                AccountNo TEXT,
                IFSCCode TEXT
            );");
    }
    catch { }

    // Ensure AccountGroups table exists
    try
    {
        context.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS AccountGroups (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Name TEXT NOT NULL,
                ParentGroupId INTEGER,
                PositionInHierarchy INTEGER NOT NULL DEFAULT 0,
                IsSubLedger INTEGER NOT NULL DEFAULT 0,
                Category INTEGER NOT NULL,
                FOREIGN KEY (ParentGroupId) REFERENCES AccountGroups(Id)
            );");

        // Seed Root Groups manually in SQL if empty
        var count = context.AccountGroups.Count();
        if (count == 0)
        {
            context.Database.ExecuteSqlRaw("INSERT INTO AccountGroups (Id, Name, Category, PositionInHierarchy, IsSubLedger) VALUES (1, 'ASSETS', 1, 1, 0);");
            context.Database.ExecuteSqlRaw("INSERT INTO AccountGroups (Id, Name, Category, PositionInHierarchy, IsSubLedger) VALUES (2, 'LIABILITIES', 2, 1, 0);");
            context.Database.ExecuteSqlRaw("INSERT INTO AccountGroups (Id, Name, Category, PositionInHierarchy, IsSubLedger) VALUES (3, 'INCOME', 3, 1, 0);");
            context.Database.ExecuteSqlRaw("INSERT INTO AccountGroups (Id, Name, Category, PositionInHierarchy, IsSubLedger) VALUES (4, 'EXPENDITURE', 4, 1, 0);");
        }
    }
    catch { }

    // Ensure AccountHeads table exists
    try
    {
        context.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS AccountHeads (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Name TEXT NOT NULL,
                AccountGroupId INTEGER NOT NULL,
                OpeningBalance DECIMAL(18, 2) NOT NULL DEFAULT 0,
                BalanceType INTEGER NOT NULL DEFAULT 1,
                Description TEXT,
                FOREIGN KEY (AccountGroupId) REFERENCES AccountGroups(Id)
            );");
    }
    catch { }

    // Customer schema updates
    try { context.Database.ExecuteSqlRaw("ALTER TABLE Customers ADD COLUMN CustomerCode TEXT NOT NULL DEFAULT '';"); } catch { }
    try { context.Database.ExecuteSqlRaw("ALTER TABLE Customers ADD COLUMN StateCode TEXT;"); } catch { }

    // InvoiceItem schema updates
    try { context.Database.ExecuteSqlRaw("ALTER TABLE InvoiceItems ADD COLUMN RI TEXT DEFAULT 'I';"); } catch { }
    try { context.Database.ExecuteSqlRaw("ALTER TABLE InvoiceItems ADD COLUMN FineWt DECIMAL(10, 3) DEFAULT 0;"); } catch { }

    // AccountHead schema updates
    try { context.Database.ExecuteSqlRaw("ALTER TABLE AccountHeads ADD COLUMN AccountCode TEXT NOT NULL DEFAULT '';"); } catch { }

    // ItemMaster schema updates
    try { context.Database.ExecuteSqlRaw("ALTER TABLE ItemsMaster ADD COLUMN OpeningStock INTEGER NOT NULL DEFAULT 0;"); } catch { }
    try { context.Database.ExecuteSqlRaw("ALTER TABLE ItemsMaster ADD COLUMN TotalWeight DECIMAL(18, 3) NOT NULL DEFAULT 0;"); } catch { }

    // StockEntries table
    try
    {
        context.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS StockEntries (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                ReferenceNo TEXT NOT NULL,
                Date TEXT NOT NULL,
                Type INTEGER NOT NULL,
                ItemMasterId INTEGER NOT NULL,
                Quantity INTEGER NOT NULL,
                Weight DECIMAL(18, 3) NOT NULL,
                Remarks TEXT,
                FOREIGN KEY (ItemMasterId) REFERENCES ItemsMaster(Id)
            );");
    }
    catch { }
    if (!context.ItemsMaster.Any())
    {
        var defaultItems = new List<ItemMaster>
        {
            // Gold Items (22K)
            new ItemMaster { Name = "Gold Ring", Category = "Gold", Purity = "22K", DefaultRate = 0, StockQuantity = 0 },
            new ItemMaster { Name = "Gold Chain", Category = "Gold", Purity = "22K", DefaultRate = 0, StockQuantity = 0 },
            new ItemMaster { Name = "Gold Bangle", Category = "Gold", Purity = "22K", DefaultRate = 0, StockQuantity = 0 },
            new ItemMaster { Name = "Gold Necklace", Category = "Gold", Purity = "22K", DefaultRate = 0, StockQuantity = 0 },
            new ItemMaster { Name = "Gold Earrings", Category = "Gold", Purity = "22K", DefaultRate = 0, StockQuantity = 0 },
            new ItemMaster { Name = "Gold Pendant", Category = "Gold", Purity = "22K", DefaultRate = 0, StockQuantity = 0 },
            new ItemMaster { Name = "Gold Mangalsutra", Category = "Gold", Purity = "22K", DefaultRate = 0, StockQuantity = 0 },
            new ItemMaster { Name = "Gold Nose Pin", Category = "Gold", Purity = "22K", DefaultRate = 0, StockQuantity = 0 },
            new ItemMaster { Name = "Gold Bracelet", Category = "Gold", Purity = "22K", DefaultRate = 0, StockQuantity = 0 },
            
            // Silver Items
            new ItemMaster { Name = "Silver Payal (Anklet)", Category = "Silver", Purity = "70%", DefaultRate = 0, StockQuantity = 0 },
            new ItemMaster { Name = "Silver Bichiya (Toe Ring)", Category = "Silver", Purity = "70%", DefaultRate = 0, StockQuantity = 0 },
            new ItemMaster { Name = "Silver Coin", Category = "Silver", Purity = "99%", DefaultRate = 0, StockQuantity = 0 },
            new ItemMaster { Name = "Silver Glass", Category = "Silver", Purity = "80%", DefaultRate = 0, StockQuantity = 0 },
            new ItemMaster { Name = "Silver Spoon", Category = "Silver", Purity = "80%", DefaultRate = 0, StockQuantity = 0 },
            new ItemMaster { Name = "Silver Idol", Category = "Silver", Purity = "80%", DefaultRate = 0, StockQuantity = 0 },
            new ItemMaster { Name = "Silver Chain", Category = "Silver", Purity = "70%", DefaultRate = 0, StockQuantity = 0 },
            new ItemMaster { Name = "Silver Bracelet", Category = "Silver", Purity = "70%", DefaultRate = 0, StockQuantity = 0 },
            new ItemMaster { Name = "Silver Ring", Category = "Silver", Purity = "70%", DefaultRate = 0, StockQuantity = 0 }
        };
        context.ItemsMaster.AddRange(defaultItems);
        context.SaveChanges();
    }
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();


app.Run();
