using System.ComponentModel.DataAnnotations;

namespace nothing.Features.Orders;

public class CreateOrderNoteRequest
{
    [Required]
    [StringLength(1000, MinimumLength = 3)]
    public string Content { get; set; } = string.Empty;
}
