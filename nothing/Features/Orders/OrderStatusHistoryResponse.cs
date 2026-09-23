using System.Text.Json.Serialization;
using nothing.Models;

namespace nothing.Features.Orders;

public class OrderStatusHistoryResponse
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public OrderStatus? PreviousStatus { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public OrderStatus NewStatus { get; set; }

    public DateTimeOffset ChangedAt { get; set; }
    public string ChangedByEmail { get; set; } = string.Empty;
}
