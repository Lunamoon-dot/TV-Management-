namespace nothing.Features.Auth;

public class CurrentUserResponse
{
    public string Id { get; set; } = string.Empty;
    public string? Email { get; set; }
    public IList<string> Roles { get; set; } = new List<string>();
}
