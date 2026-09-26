using System.Net;
using System.Net.Mail;

namespace nothing.Features.Auth;

public sealed class SmtpEmailSender : IEmailConfirmationSender, IPasswordResetEmailSender
{
    private readonly SmtpSettings _settings;

    public SmtpEmailSender(IConfiguration configuration)
    {
        _settings = new SmtpSettings(
            configuration["Smtp:Host"] ?? throw new InvalidOperationException("Smtp:Host is required."),
            configuration.GetValue<int?>("Smtp:Port") ?? 587,
            configuration["Smtp:Username"] ?? throw new InvalidOperationException("Smtp:Username is required."),
            configuration["Smtp:Password"] ?? throw new InvalidOperationException("Smtp:Password is required."),
            configuration["Smtp:From"] ?? throw new InvalidOperationException("Smtp:From is required."),
            configuration["PublicOrigin"]?.TrimEnd('/')
                ?? throw new InvalidOperationException("PublicOrigin is required."));
    }

    Task IEmailConfirmationSender.SendAsync(string email, string confirmationCode, CancellationToken cancellationToken) =>
        SendMessageAsync(
            email,
            "Xác nhận email TV Store",
            $"Xác nhận email của bạn: {_settings.PublicOrigin}/confirm-email?email={Uri.EscapeDataString(email)}&code={Uri.EscapeDataString(confirmationCode)}",
            cancellationToken);

    Task IPasswordResetEmailSender.SendAsync(string email, string resetCode, CancellationToken cancellationToken) =>
        SendMessageAsync(
            email,
            "Đặt lại mật khẩu TV Store",
            $"Đặt lại mật khẩu: {_settings.PublicOrigin}/reset-password?email={Uri.EscapeDataString(email)}&code={Uri.EscapeDataString(resetCode)}",
            cancellationToken);

    private async Task SendMessageAsync(string email, string subject, string body, CancellationToken cancellationToken)
    {
        using var client = new SmtpClient(_settings.Host, _settings.Port)
        {
            EnableSsl = true,
            Credentials = new NetworkCredential(_settings.Username, _settings.Password)
        };
        using var message = new MailMessage(_settings.From, email, subject, body);
        await client.SendMailAsync(message, cancellationToken);
    }

    private sealed record SmtpSettings(
        string Host,
        int Port,
        string Username,
        string Password,
        string From,
        string PublicOrigin);
}
