namespace nothing.Models;

public class OrderNote
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public string Content { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public string CreatedByEmail { get; set; } = string.Empty;
}
