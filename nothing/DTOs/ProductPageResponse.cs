namespace nothing.DTOs;

public class ProductPageResponse
{
    public List<ProductResponse> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
