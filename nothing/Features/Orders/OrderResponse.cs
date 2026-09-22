using System.Text.Json.Serialization;
using nothing.Models;

namespace nothing.Features.Orders;

public class OrderResponse
{
    public int Id { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public OrderStatus Status { get; set; }

    public decimal TotalAmount { get; set; }

    public List<OrderItemResponse> Items { get; set; } = [];
}
