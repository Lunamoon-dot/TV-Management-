namespace nothing.Features.Account;

public class CustomerProfileResponse
{
    public string Email { get; set; } = string.Empty;

    public string? FullName { get; set; }

    public string? PhoneNumber { get; set; }

    public string? ShippingAddress { get; set; }
}
