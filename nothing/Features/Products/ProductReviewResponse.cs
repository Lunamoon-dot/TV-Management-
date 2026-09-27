namespace nothing.Features.Products;

public sealed class ProductReviewResponse
{
    public int Id { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public string CustomerName { get; set; } = string.Empty;
}
