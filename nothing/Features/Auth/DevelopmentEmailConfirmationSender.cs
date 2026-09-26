using System.Text.Json;

namespace nothing.Features.Auth;

public sealed class DevelopmentEmailConfirmationSender : IEmailConfirmationSender
{
    private readonly string _pickupDirectory;

    public DevelopmentEmailConfirmationSender(
        IWebHostEnvironment environment,
        IConfiguration configuration)
    {
        _pickupDirectory = Path.GetFullPath(
            configuration["DevelopmentEmail:PickupDirectory"]
            ?? Path.Combine(environment.ContentRootPath, "..", ".dev-emails"));
    }

    public async Task SendAsync(
        string email,
        string confirmationCode,
        CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(_pickupDirectory);
        var path = $"/confirm-email?email={Uri.EscapeDataString(email)}&code={Uri.EscapeDataString(confirmationCode)}";
        var message = new DevelopmentEmailConfirmationMessage(
            email, confirmationCode, path, DateTimeOffset.UtcNow);
        var filePath = Path.Combine(_pickupDirectory, $"email-confirmation-{Guid.NewGuid():N}.json");
        await File.WriteAllTextAsync(
            filePath,
            JsonSerializer.Serialize(message, new JsonSerializerOptions { WriteIndented = true }),
            cancellationToken);
    }

    private sealed record DevelopmentEmailConfirmationMessage(
        string Email,
        string ConfirmationCode,
        string ConfirmationPath,
        DateTimeOffset CreatedAt);
}

