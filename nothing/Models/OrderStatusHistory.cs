namespace nothing.Models;

public class OrderStatusHistory
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public OrderStatus? PreviousStatus { get; set; }
    public OrderStatus NewStatus { get; set; }
    public DateTimeOffset ChangedAt { get; set; }
    public string ChangedByEmail { get; set; } = string.Empty;
    public string? Reason { get; set; }
}
