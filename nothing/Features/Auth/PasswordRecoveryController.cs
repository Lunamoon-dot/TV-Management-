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
public class PasswordRecoveryController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IPasswordResetEmailSender _emailSender;
    private readonly ILogger<PasswordRecoveryController> _logger;

    public PasswordRecoveryController(
        UserManager<ApplicationUser> userManager,
        IPasswordResetEmailSender emailSender,
        ILogger<PasswordRecoveryController> logger)
    {
        _userManager = userManager;
        _emailSender = emailSender;
        _logger = logger;
    }

    [HttpPost("forgot-password")]
    [EnableRateLimiting("password-reset")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ForgotPassword(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email.Trim());
        if (user is not null)
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
            try
            {
                await _emailSender.SendAsync(user.Email!, code, cancellationToken);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Failed to deliver a password reset message");
            }
        }

        return NoContent();
    }

    [HttpPost("reset-password")]
    [EnableRateLimiting("password-reset")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null) return InvalidResetCode(request);

        string token;
        try
        {
            token = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(request.ResetCode));
        }
        catch (FormatException)
        {
            return InvalidResetCode(request);
        }

        var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword);
        if (result.Succeeded) return NoContent();

        foreach (var error in result.Errors)
        {
            var field = error.Code.StartsWith("Password", StringComparison.Ordinal)
                && error.Code != "InvalidToken"
                ? nameof(request.NewPassword)
                : nameof(request.ResetCode);
            ModelState.AddModelError(field, error.Description);
        }

        return ValidationProblem(ModelState);
    }

    private ActionResult InvalidResetCode(ResetPasswordRequest request)
    {
        ModelState.AddModelError(nameof(request.ResetCode), "The password reset code is invalid.");
        return ValidationProblem(ModelState);
    }
}

