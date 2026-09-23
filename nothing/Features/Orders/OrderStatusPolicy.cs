using nothing.Models;

namespace nothing.Features.Orders;

public static class OrderStatusPolicy
{
    public static bool CanTransition(OrderStatus current, OrderStatus next) =>
        (current, next) switch
        {
            (OrderStatus.Pending, OrderStatus.Confirmed) => true,
            (OrderStatus.Pending, OrderStatus.Cancelled) => true,
            (OrderStatus.Confirmed, OrderStatus.Shipped) => true,
            (OrderStatus.Confirmed, OrderStatus.Cancelled) => true,
            (OrderStatus.Shipped, OrderStatus.Completed) => true,
            _ => false
        };

    public static bool CanCustomerCancel(OrderStatus status) =>
        status == OrderStatus.Pending;

    public static bool CanAdminCancel(OrderStatus status) =>
        status is OrderStatus.Pending or OrderStatus.Confirmed;
}
