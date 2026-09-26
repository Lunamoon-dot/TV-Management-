using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.WebUtilities;
using nothing.Models;

namespace nothing.Features.Auth;

[ApiController]
[AllowAnonymous]
[Route("api/auth")]
public class EmailConfirmationController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly EmailConfirmationService _emailConfirmationService;

    public EmailConfirmationController(
        UserManager<ApplicationUser> userManager,
        EmailConfirmationService emailConfirmationService)
    {
        _userManager = userManager;
        _emailConfirmationService = emailConfirmationService;
    }

    [HttpPost("send-confirmation-email")]
    [EnableRateLimiting("account-email")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Send(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email.Trim());
        if (user is not null && !await _userManager.IsEmailConfirmedAsync(user))
            await _emailConfirmationService.SendAsync(user, cancellationToken);

        return NoContent();
    }

    [HttpPost("confirm-email")]
    [EnableRateLimiting("account-email")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Confirm(ConfirmEmailRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null) return InvalidCode(request);

        string token;
        try
        {
            token = Encoding.UTF8.GetString(
                WebEncoders.Base64UrlDecode(request.ConfirmationCode));
        }
        catch (FormatException)
        {
            return InvalidCode(request);
        }

        var result = await _userManager.ConfirmEmailAsync(user, token);
        if (result.Succeeded) return NoContent();

        foreach (var error in result.Errors)
            ModelState.AddModelError(nameof(request.ConfirmationCode), error.Description);
        return ValidationProblem(ModelState);
    }

    private ActionResult InvalidCode(ConfirmEmailRequest request)
    {
        ModelState.AddModelError(
            nameof(request.ConfirmationCode),
            "The email confirmation code is invalid.");
        return ValidationProblem(ModelState);
    }
}
