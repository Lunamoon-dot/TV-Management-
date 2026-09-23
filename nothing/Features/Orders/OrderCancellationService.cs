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

    public OrderCancellationService(AppDbContext context)
    {
        _context = context;
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
            if (order is null) return CancelOrderResult.NotFound;

            if (order.PaymentStatus == PaymentStatus.Paid)
                return CancelOrderResult.InvalidStatus;

            var canCancel = order.Status == OrderStatus.Pending
                || allowConfirmed && order.Status == OrderStatus.Confirmed;
            if (!canCancel) return CancelOrderResult.InvalidStatus;

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
            return CancelOrderResult.Success;
        });
    }
}
