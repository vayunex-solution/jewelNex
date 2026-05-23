using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using JewelleryApp.Data;
using JewelleryApp.Models.Jewellery;
using JewelleryApp.Utilities;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace JewelleryApp.Utilities
{
    public class LicenseMiddleware
    {
        private readonly RequestDelegate _next;

        public LicenseMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var path = context.Request.Path.Value?.ToLower();

            // 1. Allow access to registration, static files, and database page (for activation)
            if (path != null && (
                path.StartsWith("/registration") || 
                path.StartsWith("/lib") || 
                path.StartsWith("/css") || 
                path.StartsWith("/js") || 
                path.StartsWith("/images") ||
                path.StartsWith("/favicon.ico") ||
                path.StartsWith("/database")
            ))
            {
                await _next(context);
                return;
            }

            // 2. Resolve DbContext
            using (var scope = context.RequestServices.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                
                try {
                    var settings = await db.ShopSettings.AsNoTracking().FirstOrDefaultAsync();
                    var currentMachineId = SecurityKeys.GetMachineId();

                    // Check for general validity (Machine Check)
                    var verification = SecurityKeys.VerifyKeyAndGetDays(currentMachineId, settings?.LicenseKey ?? "");
                    
                    if (settings == null || !verification.IsValid)
                    {
                        context.Response.Redirect("/Registration/Index");
                        return;
                    }

                    // Check for Expiry
                    if (settings.ExpiryDays > 0 && settings.ActivationDate.HasValue)
                    {
                        var expiryDate = settings.ActivationDate.Value.AddDays(settings.ExpiryDays);
                        if (DateTime.Now > expiryDate)
                        {
                            context.Response.Redirect("/Registration/Index?status=expired");
                            return;
                        }
                    }
                }
                catch {
                    await _next(context);
                    return;
                }
            }

            await _next(context);
        }
    }
}
