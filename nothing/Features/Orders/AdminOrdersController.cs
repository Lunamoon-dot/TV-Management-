using System.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
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
    private readonly UserManager<ApplicationUser> _userManager;

    public AdminOrdersController(
        AppDbContext context,
        OrderCancellationService cancellationService,
        UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _cancellationService = cancellationService;
        _userManager = userManager;
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
                PaidAt = order.PaidAt,
                PaymentConfirmedByEmail = order.PaymentConfirmedByEmail,
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

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AdminOrderDetailsResponse>> GetById(
        int id,
        CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .AsSplitQuery()
            .Where(order => order.Id == id)
            .Select(order => new AdminOrderDetailsResponse
            {
                Id = order.Id,
                CustomerEmail = order.Customer.Email ?? string.Empty,
                CreatedAt = order.CreatedAt,
                RecipientName = order.RecipientName,
                PhoneNumber = order.PhoneNumber,
                ShippingAddress = order.ShippingAddress,
                Status = order.Status,
                PaymentMethod = order.PaymentMethod,
                PaymentStatus = order.PaymentStatus,
                PaidAt = order.PaidAt,
                PaymentConfirmedByEmail = order.PaymentConfirmedByEmail,
                TotalAmount = order.TotalAmount,
                Items = order.Items
                    .OrderBy(item => item.Id)
                    .Select(item => new OrderItemResponse
                    {
                        ProductId = item.ProductId,
                        ProductName = item.ProductName,
                        BrandName = item.BrandName,
                        UnitPrice = item.UnitPrice,
                        Quantity = item.Quantity,
                        LineTotal = item.LineTotal
                    }).ToList(),
                StatusHistory = order.StatusHistory
                    .OrderBy(history => history.ChangedAt)
                    .ThenBy(history => history.Id)
                    .Select(history => new OrderStatusHistoryResponse
                    {
                        PreviousStatus = history.PreviousStatus,
                        NewStatus = history.NewStatus,
                        ChangedAt = history.ChangedAt,
                        ChangedByEmail = history.ChangedByEmail,
                        Reason = history.Reason
                    }).ToList(),
                Notes = order.Notes
                    .OrderByDescending(note => note.CreatedAt)
                    .ThenByDescending(note => note.Id)
                    .Select(note => new OrderNoteResponse
                    {
                        Id = note.Id,
                        Content = note.Content,
                        CreatedAt = note.CreatedAt,
                        CreatedByEmail = note.CreatedByEmail
                    }).ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        return order is null ? NotFound() : Ok(order);
    }

    [ValidateAntiForgeryToken]
    [HttpPost("{id:int}/notes")]
    public async Task<ActionResult<OrderNoteResponse>> CreateNote(
        int id,
        CreateOrderNoteRequest request,
        CancellationToken cancellationToken)
    {
        var content = request.Content.Trim();
        if (content.Length < 3)
        {
            ModelState.AddModelError(nameof(request.Content), "Note must be at least 3 characters.");
            return ValidationProblem(ModelState);
        }

        if (!await _context.Orders.AnyAsync(order => order.Id == id, cancellationToken))
            return NotFound();

        var admin = await _userManager.GetUserAsync(User);
        if (admin?.Email is null) return Unauthorized();

        var note = new OrderNote
        {
            OrderId = id,
            Content = content,
            CreatedAt = DateTimeOffset.UtcNow,
            CreatedByEmail = admin.Email
        };
        _context.OrderNotes.Add(note);
        await _context.SaveChangesAsync(cancellationToken);

        return StatusCode(StatusCodes.Status201Created, new OrderNoteResponse
        {
            Id = note.Id,
            Content = note.Content,
            CreatedAt = note.CreatedAt,
            CreatedByEmail = note.CreatedByEmail
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

        var admin = await _userManager.GetUserAsync(User);
        if (admin is null) return Unauthorized();

        order.PaymentStatus = PaymentStatus.Paid;
        order.PaidAt = DateTimeOffset.UtcNow;
        order.PaymentConfirmedByEmail = admin.Email;
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
        var admin = await _userManager.GetUserAsync(User);
        if (admin?.Email is null) return Unauthorized();

        if (nextStatus == OrderStatus.Cancelled)
        {
            var reason = request.Reason?.Trim();
            if (reason is null || reason.Length < 5)
            {
                ModelState.AddModelError(nameof(request.Reason), "Cancellation reason must be at least 5 characters.");
                return ValidationProblem(ModelState);
            }

            return await _cancellationService.CancelByAdminAsync(
                id,
                admin.Email,
                reason,
                cancellationToken) switch
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

        var previousStatus = order.Status;
        order.Status = nextStatus;
        order.StatusHistory.Add(new OrderStatusHistory
        {
            PreviousStatus = previousStatus,
            NewStatus = nextStatus,
            ChangedAt = DateTimeOffset.UtcNow,
            ChangedByEmail = admin.Email
        });
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
