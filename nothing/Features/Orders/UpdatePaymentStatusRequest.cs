using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using nothing.Models;

namespace nothing.Features.Orders;

public class UpdatePaymentStatusRequest
{
    [Required]
    [EnumDataType(typeof(PaymentStatus))]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public PaymentStatus? Status { get; set; }
}
