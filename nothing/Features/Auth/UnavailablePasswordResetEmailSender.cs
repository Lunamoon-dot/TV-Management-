namespace nothing.Features.Auth;

public sealed class UnavailablePasswordResetEmailSender : IPasswordResetEmailSender
{
    public Task SendAsync(string email, string resetCode, CancellationToken cancellationToken) =>
        throw new InvalidOperationException(
            "A production password reset email provider has not been configured.");
}

