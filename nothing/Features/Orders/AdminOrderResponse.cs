using System.Text.Json.Serialization;
using nothing.Models;

namespace nothing.Features.Orders;

public class AdminOrderResponse
{
    public int Id { get; set; }
    public string CustomerEmail { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public OrderStatus Status { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public PaymentMethod PaymentMethod { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public PaymentStatus PaymentStatus { get; set; }

    public DateTimeOffset? PaidAt { get; set; }
    public string? PaymentConfirmedByEmail { get; set; }

    public decimal TotalAmount { get; set; }
    public int ItemCount { get; set; }
}
