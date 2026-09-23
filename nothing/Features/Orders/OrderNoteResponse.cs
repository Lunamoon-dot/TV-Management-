namespace nothing.Features.Orders;

public class OrderNoteResponse
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public string CreatedByEmail { get; set; } = string.Empty;
}
