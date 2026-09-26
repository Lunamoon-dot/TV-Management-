namespace nothing.Features.Auth;

public interface IEmailConfirmationSender
{
    Task SendAsync(string email, string confirmationCode, CancellationToken cancellationToken);
}

