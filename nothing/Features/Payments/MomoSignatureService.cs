using System.Security.Cryptography;
using System.Text;

namespace nothing.Features.Payments;

public sealed class MomoSignatureService(IConfiguration configuration)
{
    public bool IsValid(MomoIpnRequest request)
    {
        var secret = configuration["Momo:SecretKey"];
        var accessKey = configuration["Momo:AccessKey"];
        if (string.IsNullOrWhiteSpace(secret) || string.IsNullOrWhiteSpace(accessKey) || string.IsNullOrWhiteSpace(request.Signature)) return false;
        var raw = $"accessKey={accessKey}&amount={request.Amount}&extraData={request.ExtraData ?? ""}&message={request.Message ?? ""}&orderId={request.OrderId}&orderInfo={request.OrderInfo}&orderType={request.OrderType}&partnerCode={request.PartnerCode}&payType={request.PayType}&requestId={request.RequestId}&responseTime={request.ResponseTime}&resultCode={request.ResultCode}&transId={request.TransId}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var expected = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(raw))).ToLowerInvariant();
        return CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(request.Signature));
    }
}
