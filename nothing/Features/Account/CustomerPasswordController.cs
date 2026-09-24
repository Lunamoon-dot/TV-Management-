using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using nothing.Models;

namespace nothing.Features.Account;

[ApiController]
[Authorize]
[Route("api/account/password")]
public class CustomerPasswordController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;

    public CustomerPasswordController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager)
    {
        _userManager = userManager;
        _signInManager = signInManager;
    }

    [HttpPut]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Change(ChangePasswordRequest request)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();

        var result = await _userManager.ChangePasswordAsync(
            user, request.CurrentPassword, request.NewPassword);

        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                var field = error.Code == "PasswordMismatch"
                    ? nameof(request.CurrentPassword)
                    : nameof(request.NewPassword);
                ModelState.AddModelError(field, error.Description);
            }

            return ValidationProblem(ModelState);
        }

        await _signInManager.RefreshSignInAsync(user);
        return NoContent();
    }
}

