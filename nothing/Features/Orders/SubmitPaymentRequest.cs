using System.ComponentModel.DataAnnotations;

namespace nothing.Features.Orders;

public sealed class SubmitPaymentRequest
{
    [Required, StringLength(100, MinimumLength = 3)]
    public string? PaymentReference { get; set; }
}
