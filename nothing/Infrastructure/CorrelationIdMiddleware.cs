namespace nothing.Infrastructure;

public class CorrelationIdMiddleware
{
    public const string HeaderName = "X-Correlation-ID";

    private readonly RequestDelegate _next;
    private readonly ILogger<CorrelationIdMiddleware> _logger;

    public CorrelationIdMiddleware(RequestDelegate next, ILogger<CorrelationIdMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var requestedId = context.Request.Headers[HeaderName].FirstOrDefault();
        var correlationId = IsValid(requestedId)
            ? requestedId!
            : Guid.NewGuid().ToString("N");

        context.TraceIdentifier = correlationId;
        context.Response.OnStarting(() =>
        {
            context.Response.Headers[HeaderName] = correlationId;
            return Task.CompletedTask;
        });

        using (_logger.BeginScope(new Dictionary<string, object>
        {
            ["CorrelationId"] = correlationId
        }))
        {
            await _next(context);
        }
    }

    private static bool IsValid(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > 64) return false;

        return value.All(character =>
            character is >= 'a' and <= 'z' or
            >= 'A' and <= 'Z' or
            >= '0' and <= '9' or
            '-' or '_' or '.');
    }
}
