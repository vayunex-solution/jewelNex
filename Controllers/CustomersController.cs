using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JewelleryApp.Data;
using JewelleryApp.Models.Jewellery;

namespace JewelleryApp.Controllers
{
    public class CustomersController : Controller
    {
        private readonly ApplicationDbContext _context;

        public CustomersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: Customers
        public async Task<IActionResult> Index()
        {
            return View(await _context.Customers.OrderBy(x => x.Name).ToListAsync());
        }

        // GET: Customers/Create
        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("Name,Mobile,Address,StateCode,OpeningBalance,BalanceType")] Customer customer)
        {
            if (ModelState.IsValid)
            {
                // Auto-generate Customer Code
                var count = await _context.Customers.CountAsync();
                customer.CustomerCode = $"CUST{(count + 1):D4}";
                
                _context.Add(customer);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(customer);
        }

        // API for Invoice Dropdown
        [HttpGet]
        public async Task<JsonResult> GetAllCustomers()
        {
            var customers = await _context.Customers
                .Select(x => new { id = x.Id, name = x.Name, mobile = x.Mobile, address = x.Address, stateCode = x.StateCode })
                .ToListAsync();
            return Json(customers);
        }

        // Delete (Simplified)
        public async Task<IActionResult> Delete(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer != null)
            {
                _context.Customers.Remove(customer);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }
    }
}
