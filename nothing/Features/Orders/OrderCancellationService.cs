using System.Data;
using Microsoft.EntityFrameworkCore;
using nothing.Data;
using nothing.Models;

namespace nothing.Features.Orders;

public enum CancelOrderResult
{
    Success,
    NotFound,
    InvalidStatus
}

public class OrderCancellationService
{
    private readonly AppDbContext _context;
    private readonly ILogger<OrderCancellationService> _logger;

    public OrderCancellationService(
        AppDbContext context,
        ILogger<OrderCancellationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public Task<CancelOrderResult> CancelByCustomerAsync(
        int id,
        string customerId,
        string changedByEmail,
        string reason,
        CancellationToken cancellationToken) =>
        CancelAsync(id, customerId, changedByEmail, reason, allowConfirmed: false, cancellationToken);

    public Task<CancelOrderResult> CancelByAdminAsync(
        int id,
        string changedByEmail,
        string reason,
        CancellationToken cancellationToken) =>
        CancelAsync(id, customerId: null, changedByEmail, reason, allowConfirmed: true, cancellationToken);

    private async Task<CancelOrderResult> CancelAsync(
        int id,
        string? customerId,
        string changedByEmail,
        string reason,
        bool allowConfirmed,
        CancellationToken cancellationToken)
    {
        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            var orders = _context.Orders.Where(order => order.Id == id);
            if (customerId is not null)
                orders = orders.Where(order => order.CustomerId == customerId);

            var order = await orders
                .Include(order => order.Items)
                .ThenInclude(item => item.Product)
                .FirstOrDefaultAsync(cancellationToken);
            if (order is null)
            {
                _logger.LogWarning(
                    "Cancellation rejected because order {OrderId} was not found or was not owned by the customer",
                    id);
                return CancelOrderResult.NotFound;
            }

            if (order.PaymentStatus == PaymentStatus.Paid)
            {
                _logger.LogWarning("Cancellation rejected because order {OrderId} is already paid", id);
                return CancelOrderResult.InvalidStatus;
            }

            var canCancel = order.Status == OrderStatus.Pending
                || allowConfirmed && order.Status == OrderStatus.Confirmed;
            if (!canCancel)
            {
                _logger.LogWarning(
                    "Cancellation rejected for order {OrderId} in status {OrderStatus}",
                    id,
                    order.Status);
                return CancelOrderResult.InvalidStatus;
            }

            foreach (var item in order.Items)
                item.Product.Stock += item.Quantity;

            var previousStatus = order.Status;
            order.Status = OrderStatus.Cancelled;
            order.StatusHistory.Add(new OrderStatusHistory
            {
                PreviousStatus = previousStatus,
                NewStatus = OrderStatus.Cancelled,
                ChangedAt = DateTimeOffset.UtcNow,
                ChangedByEmail = changedByEmail,
                Reason = reason.Trim()
            });
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            _logger.LogInformation(
                "Cancelled order {OrderId} and restored stock for {ItemCount} line items by {ActorType}",
                order.Id,
                order.Items.Count,
                customerId is null ? "Admin" : "Customer");
            return CancelOrderResult.Success;
        });
    }
}
