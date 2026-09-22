using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using nothing.Models;

namespace nothing.Features.Orders;

public class UpdateOrderStatusRequest
{
    [Required]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public OrderStatus? Status { get; set; }
}
