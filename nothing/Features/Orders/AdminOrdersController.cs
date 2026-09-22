using System.Data;
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
    private readonly OrderCancellationService _cancellationService;

    public AdminOrdersController(AppDbContext context, OrderCancellationService cancellationService)
    {
        _context = context;
        _cancellationService = cancellationService;
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
                PaymentMethod = order.PaymentMethod,
                PaymentStatus = order.PaymentStatus,
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
    [HttpPut("{id:int}/payment-status")]
    public async Task<IActionResult> UpdatePaymentStatus(
        int id,
        UpdatePaymentStatusRequest request,
        CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .FirstOrDefaultAsync(order => order.Id == id, cancellationToken);
        if (order is null) return NotFound();

        if (request.Status != PaymentStatus.Paid)
        {
            ModelState.AddModelError(nameof(request.Status), "Payment can only be marked as Paid.");
            return ValidationProblem(ModelState);
        }

        if (order.Status == OrderStatus.Cancelled)
        {
            ModelState.AddModelError(nameof(request.Status), "A cancelled order cannot be marked as paid.");
            return ValidationProblem(ModelState);
        }

        if (order.PaymentStatus == PaymentStatus.Paid) return NoContent();

        order.PaymentStatus = PaymentStatus.Paid;
        await _context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [ValidateAntiForgeryToken]
    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        UpdateOrderStatusRequest request,
        CancellationToken cancellationToken)
    {
        var nextStatus = request.Status!.Value;
        if (nextStatus == OrderStatus.Cancelled)
        {
            return await _cancellationService.CancelByAdminAsync(id, cancellationToken) switch
            {
                CancelOrderResult.Success => NoContent(),
                CancelOrderResult.NotFound => NotFound(),
                _ => InvalidTransition("Only Pending or Confirmed orders can be cancelled.")
            };
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        var order = await _context.Orders
            .FirstOrDefaultAsync(order => order.Id == id, cancellationToken);
        if (order is null) return NotFound();

        if (!CanTransition(order.Status, nextStatus))
        {
            ModelState.AddModelError(nameof(request.Status),
                $"Cannot change order status from {order.Status} to {nextStatus}.");
            return ValidationProblem(ModelState);
        }

        order.Status = nextStatus;
        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return NoContent();
    }

    private IActionResult InvalidTransition(string message)
    {
        ModelState.AddModelError(nameof(UpdateOrderStatusRequest.Status), message);
        return ValidationProblem(ModelState);
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
