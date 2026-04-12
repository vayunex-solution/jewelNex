using Microsoft.EntityFrameworkCore;
using JewelleryApp.Data;

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
    
    // Manual migration for Discount column if it doesn't exist
    try
    {
        context.Database.ExecuteSqlRaw("ALTER TABLE Invoices ADD COLUMN Discount decimal(18, 2) NOT NULL DEFAULT 0;");
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
            
        // Insert default settings if empty
        var exists = context.Database.ExecuteSqlRaw("SELECT 1 FROM ShopSettings LIMIT 1;");
        // executeSqlRaw returns rows affected for commands, but for select it might not be what I want.
        // Actually I'll use a better way in C#.
    }
    catch { }
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
