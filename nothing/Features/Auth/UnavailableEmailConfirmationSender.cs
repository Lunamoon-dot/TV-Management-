namespace nothing.Features.Auth;

public sealed class UnavailableEmailConfirmationSender : IEmailConfirmationSender
{
    public Task SendAsync(string email, string confirmationCode, CancellationToken cancellationToken) =>
        throw new InvalidOperationException(
            "A production email confirmation provider has not been configured.");
}

