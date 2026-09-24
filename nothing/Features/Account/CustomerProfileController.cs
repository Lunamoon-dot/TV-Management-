using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using nothing.Models;

namespace nothing.Features.Account;

[ApiController]
[Authorize]
[Route("api/account/profile")]
public class CustomerProfileController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;

    public CustomerProfileController(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult<CustomerProfileResponse>> Get()
    {
        var user = await _userManager.GetUserAsync(User);
        return user is null ? Unauthorized() : Ok(ToResponse(user));
    }

    [HttpPut]
    [ValidateAntiForgeryToken]
    public async Task<ActionResult<CustomerProfileResponse>> Update(
        UpdateCustomerProfileRequest request)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();

        user.FullName = request.FullName.Trim();
        user.PhoneNumber = request.PhoneNumber.Trim();
        user.ShippingAddress = request.ShippingAddress.Trim();

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
                ModelState.AddModelError(string.Empty, error.Description);
            return ValidationProblem(ModelState);
        }

        return Ok(ToResponse(user));
    }

    private static CustomerProfileResponse ToResponse(ApplicationUser user) => new()
    {
        Email = user.Email ?? string.Empty,
        FullName = user.FullName,
        PhoneNumber = user.PhoneNumber,
        ShippingAddress = user.ShippingAddress
    };
}
