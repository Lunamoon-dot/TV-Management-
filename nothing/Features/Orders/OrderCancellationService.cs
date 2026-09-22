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
        CancellationToken cancellationToken) =>
        CancelAsync(id, customerId, allowConfirmed: false, cancellationToken);

    public Task<CancelOrderResult> CancelByAdminAsync(
        int id,
        CancellationToken cancellationToken) =>
        CancelAsync(id, customerId: null, allowConfirmed: true, cancellationToken);

    private async Task<CancelOrderResult> CancelAsync(
        int id,
        string? customerId,
        bool allowConfirmed,
        CancellationToken cancellationToken)
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

        order.Status = OrderStatus.Cancelled;
        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return CancelOrderResult.Success;
    }
}
