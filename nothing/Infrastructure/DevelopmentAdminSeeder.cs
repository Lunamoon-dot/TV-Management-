using Microsoft.AspNetCore.Identity;
using nothing.Features.Auth;
using nothing.Models;

namespace nothing.Infrastructure;

public sealed class DevelopmentAdminSeeder : IHostedService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;
    private readonly IHostEnvironment _environment;
    private readonly ILogger<DevelopmentAdminSeeder> _logger;

    public DevelopmentAdminSeeder(
        IServiceProvider serviceProvider,
        IConfiguration configuration,
        IHostEnvironment environment,
        ILogger<DevelopmentAdminSeeder> logger)
    {
        _serviceProvider = serviceProvider;
        _configuration = configuration;
        _environment = environment;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        if (!_environment.IsDevelopment()) return;

        using var scope = _serviceProvider.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        if (!await roleManager.RoleExistsAsync(AppRoles.Admin))
        {
            var roleResult = await roleManager.CreateAsync(new IdentityRole(AppRoles.Admin));
            EnsureSucceeded(roleResult, "Không thể tạo role Admin.");
        }

        var email = _configuration["BootstrapAdmin:Email"]?.Trim();
        if (string.IsNullOrWhiteSpace(email)) return;

        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            var password = _configuration["BootstrapAdmin:Password"];
            if (string.IsNullOrWhiteSpace(password))
            {
                _logger.LogWarning(
                    "Skipping local development admin bootstrap for {Email} because BootstrapAdmin:Password is not configured.",
                    email);
                return;
            }

            user = new ApplicationUser { UserName = email, Email = email };
            var createResult = await userManager.CreateAsync(user, password);
            EnsureSucceeded(createResult, "Không thể tạo tài khoản Admin local.");
            _logger.LogInformation("Created local development admin account for {Email}.", email);
        }

        if (!await userManager.IsInRoleAsync(user, AppRoles.Admin))
        {
            var addRoleResult = await userManager.AddToRoleAsync(user, AppRoles.Admin);
            EnsureSucceeded(addRoleResult, "Không thể gán role Admin.");
            _logger.LogInformation("Assigned Admin role to local development account {Email}.", email);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private static void EnsureSucceeded(IdentityResult result, string message)
    {
        if (result.Succeeded) return;

        throw new InvalidOperationException($"{message} {string.Join(" ", result.Errors.Select(error => error.Description))}");
    }
}
