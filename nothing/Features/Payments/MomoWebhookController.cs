using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using nothing.Data;
using nothing.Models;

namespace nothing.Features.Payments;

[ApiController]
[Route("api/payments/momo")]
public sealed class MomoWebhookController(AppDbContext context, MomoSignatureService signatures, ILogger<MomoWebhookController> logger) : ControllerBase
{
    [HttpPost("ipn")]
    [IgnoreAntiforgeryToken]
    public async Task<IActionResult> Receive(MomoIpnRequest request, CancellationToken cancellationToken)
    {
        if (!signatures.IsValid(request)) return Unauthorized();
        if (request.ResultCode != 0) return Ok(new { received = true });
        if (!int.TryParse(request.OrderId, out var orderId)) return BadRequest();
        var order = await context.Orders.FirstOrDefaultAsync(order => order.Id == orderId, cancellationToken);
        if (order is null || order.PaymentMethod != PaymentMethod.Momo || request.Amount != decimal.ToInt64(order.TotalAmount)) return BadRequest();
        if (order.PaymentStatus == PaymentStatus.Paid) return Ok(new { received = true });
        order.PaymentStatus = PaymentStatus.Paid;
        order.PaidAt = DateTimeOffset.UtcNow;
        order.PaymentReference = request.TransId;
        order.PaymentSubmittedAt ??= DateTimeOffset.UtcNow;
        order.PaymentConfirmedByEmail = "momo-webhook";
        await context.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Confirmed MoMo payment for order {OrderId}, transaction {TransactionId}", order.Id, request.TransId);
        return Ok(new { received = true });
    }
}
