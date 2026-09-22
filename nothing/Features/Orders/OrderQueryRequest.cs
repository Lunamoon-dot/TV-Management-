using System.ComponentModel.DataAnnotations;

namespace nothing.Features.Orders;

public class OrderQueryRequest
{
    [Range(1, 1_000_000)]
    public int Page { get; set; } = 1;

    [Range(1, 50)]
    public int PageSize { get; set; } = 10;
}
