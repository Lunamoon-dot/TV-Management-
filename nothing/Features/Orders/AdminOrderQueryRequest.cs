using System.ComponentModel.DataAnnotations;
using nothing.Models;

namespace nothing.Features.Orders;

public class AdminOrderQueryRequest : OrderQueryRequest
{
    [StringLength(256)]
    public string? Search { get; set; }
    public OrderStatus? Status { get; set; }
    public PaymentStatus? PaymentStatus { get; set; }
}
