namespace nothing.Models;

public class Order
{
    public int Id { get; set; }

    public string CustomerId { get; set; } = string.Empty;

    public ApplicationUser Customer { get; set; } = null!;

    public DateTimeOffset CreatedAt { get; set; }

    public decimal TotalAmount { get; set; }

    public List<OrderItem> Items { get; set; } = [];
}
