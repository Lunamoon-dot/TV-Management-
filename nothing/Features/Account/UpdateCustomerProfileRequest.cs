using System.ComponentModel.DataAnnotations;

namespace nothing.Features.Account;

public class UpdateCustomerProfileRequest
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [StringLength(20, MinimumLength = 8)]
    [RegularExpression(@"^[0-9+\s().-]+$")]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    [StringLength(300, MinimumLength = 10)]
    public string ShippingAddress { get; set; } = string.Empty;
}
