using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using JewelleryApp.Data;
using JewelleryApp.Models.Jewellery;

namespace JewelleryApp.Controllers
{
    public class AccountHeadsController : Controller
    {
        private readonly ApplicationDbContext _context;

        public AccountHeadsController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var accounts = await _context.AccountHeads
                .Include(a => a.AccountGroup)
                .ToListAsync();
            
            ViewBag.Groups = new SelectList(await _context.AccountGroups.OrderBy(g => g.Name).ToListAsync(), "Id", "Name");
            return View(accounts);
        }

        [HttpPost]
        public async Task<IActionResult> Create(AccountHead accountHead)
        {
            if (ModelState.IsValid)
            {
                // Auto-generate Account Code
                var count = await _context.AccountHeads.CountAsync();
                accountHead.AccountCode = $"ACC{(count + 1):D4}";
                
                _context.Add(accountHead);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        public async Task<IActionResult> Edit(AccountHead accountHead)
        {
            if (ModelState.IsValid)
            {
                _context.Update(accountHead);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        public async Task<IActionResult> Delete(int id)
        {
            var account = await _context.AccountHeads.FindAsync(id);
            if (account != null)
            {
                _context.AccountHeads.Remove(account);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }
    }
}
