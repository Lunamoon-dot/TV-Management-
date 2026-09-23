using System.ComponentModel.DataAnnotations;

namespace nothing.Features.Orders;

public class CancelOrderRequest
{
    [Required]
    [StringLength(300, MinimumLength = 5)]
    public string Reason { get; set; } = string.Empty;
}
