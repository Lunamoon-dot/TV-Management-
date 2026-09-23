using nothing.Features.Orders;
using nothing.Models;

namespace nothing.Tests.Features.Orders;

public class OrderStatusPolicyTests
{
    public static TheoryData<OrderStatus, OrderStatus> AllowedTransitions => new()
    {
        { OrderStatus.Pending, OrderStatus.Confirmed },
        { OrderStatus.Pending, OrderStatus.Cancelled },
        { OrderStatus.Confirmed, OrderStatus.Shipped },
        { OrderStatus.Confirmed, OrderStatus.Cancelled },
        { OrderStatus.Shipped, OrderStatus.Completed }
    };

    [Theory]
    [MemberData(nameof(AllowedTransitions))]
    public void Allows_defined_workflow_transitions(OrderStatus current, OrderStatus next)
    {
        Assert.True(OrderStatusPolicy.CanTransition(current, next));
    }

    [Theory]
    [InlineData(OrderStatus.Pending, OrderStatus.Shipped)]
    [InlineData(OrderStatus.Confirmed, OrderStatus.Completed)]
    [InlineData(OrderStatus.Shipped, OrderStatus.Cancelled)]
    [InlineData(OrderStatus.Completed, OrderStatus.Pending)]
    [InlineData(OrderStatus.Cancelled, OrderStatus.Pending)]
    public void Rejects_skipped_or_terminal_transitions(OrderStatus current, OrderStatus next)
    {
        Assert.False(OrderStatusPolicy.CanTransition(current, next));
    }

    [Fact]
    public void Customer_can_only_cancel_pending_orders()
    {
        Assert.True(OrderStatusPolicy.CanCustomerCancel(OrderStatus.Pending));
        Assert.False(OrderStatusPolicy.CanCustomerCancel(OrderStatus.Confirmed));
        Assert.False(OrderStatusPolicy.CanCustomerCancel(OrderStatus.Shipped));
    }

    [Fact]
    public void Admin_can_cancel_pending_or_confirmed_orders()
    {
        Assert.True(OrderStatusPolicy.CanAdminCancel(OrderStatus.Pending));
        Assert.True(OrderStatusPolicy.CanAdminCancel(OrderStatus.Confirmed));
        Assert.False(OrderStatusPolicy.CanAdminCancel(OrderStatus.Shipped));
        Assert.False(OrderStatusPolicy.CanAdminCancel(OrderStatus.Completed));
    }
}
