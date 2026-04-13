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

    // Seed default Items if Master is empty
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
