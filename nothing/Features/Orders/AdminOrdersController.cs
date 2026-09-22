using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using nothing.Data;
using nothing.Features.Auth;
using nothing.Models;

namespace nothing.Features.Orders;

[ApiController]
[Route("api/admin/orders")]
[Authorize(Roles = AppRoles.Admin)]
public class AdminOrdersController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminOrdersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<AdminOrderPageResponse>> GetAll(
        [FromQuery] OrderQueryRequest query,
        CancellationToken cancellationToken)
    {
        var totalCount = await _context.Orders.CountAsync(cancellationToken);
        var items = await _context.Orders
            .OrderByDescending(order => order.CreatedAt)
            .ThenByDescending(order => order.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(order => new AdminOrderResponse
            {
                Id = order.Id,
                CustomerEmail = order.Customer.Email ?? string.Empty,
                CreatedAt = order.CreatedAt,
                Status = order.Status,
                TotalAmount = order.TotalAmount,
                ItemCount = order.Items.Count
            })
            .ToListAsync(cancellationToken);

        return Ok(new AdminOrderPageResponse
        {
            Items = items,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    [ValidateAntiForgeryToken]
    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        UpdateOrderStatusRequest request,
        CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .FirstOrDefaultAsync(order => order.Id == id, cancellationToken);
        if (order is null) return NotFound();

        var nextStatus = request.Status!.Value;
        if (!CanTransition(order.Status, nextStatus))
        {
            ModelState.AddModelError(nameof(request.Status),
                $"Cannot change order status from {order.Status} to {nextStatus}.");
            return ValidationProblem(ModelState);
        }

        order.Status = nextStatus;
        await _context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static bool CanTransition(OrderStatus current, OrderStatus next) =>
        (current, next) switch
        {
            (OrderStatus.Pending, OrderStatus.Confirmed) => true,
            (OrderStatus.Pending, OrderStatus.Cancelled) => true,
            (OrderStatus.Confirmed, OrderStatus.Shipped) => true,
            (OrderStatus.Confirmed, OrderStatus.Cancelled) => true,
            (OrderStatus.Shipped, OrderStatus.Completed) => true,
            _ => false
        };
}
