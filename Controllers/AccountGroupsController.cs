using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using JewelleryApp.Data;
using JewelleryApp.Models.Jewellery;

namespace JewelleryApp.Controllers
{
    public class AccountGroupsController : Controller
    {
        private readonly ApplicationDbContext _context;

        public AccountGroupsController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var groups = await _context.AccountGroups
                .Include(g => g.ParentGroup)
                .Include(g => g.SubGroups)
                .ToListAsync();

            ViewBag.ParentGroups = new SelectList(groups, "Id", "Name");
            return View(groups);
        }

        [HttpPost]
        public async Task<IActionResult> Create(AccountGroup accountGroup)
        {
            if (ModelState.IsValid)
            {
                // Inherit category from parent if selected
                if (accountGroup.ParentGroupId.HasValue)
                {
                    var parent = await _context.AccountGroups.FindAsync(accountGroup.ParentGroupId.Value);
                    if (parent != null) accountGroup.Category = parent.Category;
                }

                _context.Add(accountGroup);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        public async Task<IActionResult> Edit(AccountGroup accountGroup)
        {
            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(accountGroup);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!AccountGroupExists(accountGroup.Id)) return NotFound();
                    else throw;
                }
                return RedirectToAction(nameof(Index));
            }
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        public async Task<IActionResult> Delete(int id)
        {
            var group = await _context.AccountGroups.FindAsync(id);
            if (group != null)
            {
                // Safety check: Don't delete root groups
                if (group.Id <= 4) return BadRequest("Root groups cannot be deleted.");
                
                _context.AccountGroups.Remove(group);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }

        private bool AccountGroupExists(int id) => _context.AccountGroups.Any(e => e.Id == id);
    }
}
