using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JewelleryApp.Data;
using JewelleryApp.Models.Jewellery;
using Microsoft.AspNetCore.Authorization;

namespace JewelleryApp.Controllers
{
    [Authorize(Roles = "Admin")]
    public class UserMasterController : Controller
    {
        private readonly ApplicationDbContext _context;

        public UserMasterController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: UserMaster
        public async Task<IActionResult> Index()
        {
            return View(await _context.Users.OrderBy(x => x.Username).ToListAsync());
        }

        // GET: UserMaster/Create
        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("Username,Password,FullName,Role")] User user)
        {
            if (ModelState.IsValid)
            {
                user.CreatedAt = DateTime.Now;
                _context.Add(user);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(user);
        }

        // GET: UserMaster/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            return View(user);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("Id,Username,Password,FullName,Role,CreatedAt")] User user)
        {
            if (id != user.Id) return NotFound();

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(user);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!_context.Users.Any(e => e.Id == user.Id)) return NotFound();
                    else throw;
                }
                return RedirectToAction(nameof(Index));
            }
            return View(user);
        }

        // Delete
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user != null)
            {
                // Prevent deleting the last admin or the currently logged in user if necessary
                // For now, simple delete
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }
    }
}
