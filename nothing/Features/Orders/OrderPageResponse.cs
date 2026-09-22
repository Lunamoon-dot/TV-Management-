namespace nothing.Features.Orders;

public class OrderPageResponse
{
    public List<OrderResponse> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
