using System.ComponentModel.DataAnnotations;

namespace nothing.Features.Orders;

public class CreateOrderRequest
{
    [Required]
    [MinLength(1)]
    [MaxLength(50)]
    public List<CreateOrderItemRequest> Items { get; set; } = [];
}
