using Microsoft.AspNetCore.Identity;

namespace nothing.Models;

public class ApplicationUser : IdentityUser
{
    public string? FullName { get; set; }

    public string? ShippingAddress { get; set; }
}
