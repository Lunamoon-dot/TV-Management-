using System.Text.Json;

namespace nothing.Features.Auth;

public sealed class DevelopmentPasswordResetEmailSender : IPasswordResetEmailSender
{
    private readonly string _pickupDirectory;

    public DevelopmentPasswordResetEmailSender(
        IWebHostEnvironment environment,
        IConfiguration configuration)
    {
        _pickupDirectory = Path.GetFullPath(
            configuration["DevelopmentEmail:PickupDirectory"]
            ?? Path.Combine(environment.ContentRootPath, "..", ".dev-emails"));
    }

    public async Task SendAsync(
        string email,
        string resetCode,
        CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(_pickupDirectory);
        var message = new DevelopmentPasswordResetMessage(
            email,
            resetCode,
            $"/reset-password?email={Uri.EscapeDataString(email)}&code={Uri.EscapeDataString(resetCode)}",
            DateTimeOffset.UtcNow);
        var path = Path.Combine(_pickupDirectory, $"password-reset-{Guid.NewGuid():N}.json");
        await File.WriteAllTextAsync(
            path,
            JsonSerializer.Serialize(message, new JsonSerializerOptions { WriteIndented = true }),
            cancellationToken);
    }

    private sealed record DevelopmentPasswordResetMessage(
        string Email,
        string ResetCode,
        string ResetPath,
        DateTimeOffset CreatedAt);
}
