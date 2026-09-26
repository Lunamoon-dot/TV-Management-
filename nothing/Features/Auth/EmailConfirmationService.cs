using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using nothing.Models;

namespace nothing.Features.Auth;

public sealed class EmailConfirmationService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IEmailConfirmationSender _emailSender;
    private readonly ILogger<EmailConfirmationService> _logger;

    public EmailConfirmationService(
        UserManager<ApplicationUser> userManager,
        IEmailConfirmationSender emailSender,
        ILogger<EmailConfirmationService> logger)
    {
        _userManager = userManager;
        _emailSender = emailSender;
        _logger = logger;
    }

    public async Task SendAsync(
        ApplicationUser user,
        CancellationToken cancellationToken)
    {
        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
        try
        {
            await _emailSender.SendAsync(user.Email!, code, cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Failed to deliver an email confirmation message");
        }
    }
}

