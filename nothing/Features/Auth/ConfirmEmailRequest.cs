using System.ComponentModel.DataAnnotations;

namespace nothing.Features.Auth;

public class ConfirmEmailRequest
{
    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(4096)]
    public string ConfirmationCode { get; set; } = string.Empty;
}

