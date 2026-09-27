using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using nothing.Data;
using nothing.Models;

namespace nothing.Features.Wishlist;

[ApiController, Authorize, Route("api/wishlist")]
public sealed class WishlistController(AppDbContext context, UserManager<ApplicationUser> users) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var userId = users.GetUserId(User);
        return Ok(await context.WishlistItems.Where(item => item.CustomerId == userId).OrderByDescending(item => item.CreatedAt).Select(item => item.Product).Select(product => new { product.Id, product.Name, product.Price, Brand = product.Brand.Name, product.Stock }).ToListAsync(cancellationToken));
    }

    [ValidateAntiForgeryToken, HttpPost("{productId:int}")]
    public async Task<IActionResult> Add(int productId, CancellationToken cancellationToken)
    {
        var userId = users.GetUserId(User);
        if (!await context.Products.AnyAsync(product => product.Id == productId, cancellationToken)) return NotFound();
        if (!await context.WishlistItems.AnyAsync(item => item.CustomerId == userId && item.ProductId == productId, cancellationToken))
            context.WishlistItems.Add(new WishlistItem { CustomerId = userId!, ProductId = productId, CreatedAt = DateTimeOffset.UtcNow });
        await context.SaveChangesAsync(cancellationToken); return NoContent();
    }

    [ValidateAntiForgeryToken, HttpDelete("{productId:int}")]
    public async Task<IActionResult> Remove(int productId, CancellationToken cancellationToken)
    {
        var userId = users.GetUserId(User);
        var item = await context.WishlistItems.FirstOrDefaultAsync(item => item.CustomerId == userId && item.ProductId == productId, cancellationToken);
        if (item is not null) { context.WishlistItems.Remove(item); await context.SaveChangesAsync(cancellationToken); }
        return NoContent();
    }
}
