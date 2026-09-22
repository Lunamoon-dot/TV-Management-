using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using nothing.Models;

namespace nothing.Features.Orders;

public class CreateOrderRequest
{
    public Guid CheckoutId { get; set; }

    [Required]
    [EnumDataType(typeof(PaymentMethod))]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public PaymentMethod? PaymentMethod { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string RecipientName { get; set; } = string.Empty;

    [Required]
    [StringLength(20, MinimumLength = 8)]
    [RegularExpression(@"^[0-9+\s().-]+$")]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    [StringLength(300, MinimumLength = 10)]
    public string ShippingAddress { get; set; } = string.Empty;

    [Required]
    [MinLength(1)]
    [MaxLength(50)]
    public List<CreateOrderItemRequest> Items { get; set; } = [];
}
