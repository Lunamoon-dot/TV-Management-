using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using nothing.Data;
using nothing.Features.Auth;

namespace nothing.Features.Inventory;

[ApiController, Authorize(Roles = AppRoles.Admin), Route("api/admin/inventory")]
public sealed class InventoryController(AppDbContext context) : ControllerBase
{
    [HttpGet("low-stock")]
    public async Task<IActionResult> LowStock([FromQuery] int threshold = 5, CancellationToken cancellationToken = default)
    {
        threshold = Math.Clamp(threshold, 0, 1000);
        return Ok(await context.Products.Where(product => product.Stock <= threshold).OrderBy(product => product.Stock).Select(product => new { product.Id, product.Name, Brand = product.Brand.Name, product.Stock }).ToListAsync(cancellationToken));
    }
}
