namespace nothing.Features.Auth;

public interface IPasswordResetEmailSender
{
    Task SendAsync(string email, string resetCode, CancellationToken cancellationToken);
}

