using System.ComponentModel.DataAnnotations;

namespace nothing.Features.Orders;

public class CreateOrderItemRequest
{
    [Range(1, int.MaxValue)]
    public int ProductId { get; set; }

    [Range(1, 100)]
    public int Quantity { get; set; }
}
