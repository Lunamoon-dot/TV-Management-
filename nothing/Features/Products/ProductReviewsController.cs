using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using nothing.Data;
using nothing.Models;
using nothing.Features.Auth;

namespace nothing.Features.Products;

[ApiController]
[Route("api/products/{productId:int}/reviews")]
public sealed class ProductReviewsController(AppDbContext context, UserManager<ApplicationUser> users) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductReviewResponse>>> Get(int productId, CancellationToken cancellationToken) => Ok(
        await context.ProductReviews.Where(review => review.ProductId == productId && review.IsVisible).OrderByDescending(review => review.CreatedAt).Select(review => new ProductReviewResponse
        {
            Id = review.Id, Rating = review.Rating, Comment = review.Comment, CreatedAt = review.CreatedAt,
            CustomerName = review.Customer.FullName ?? review.Customer.Email ?? "Khách hàng"
        }).ToListAsync(cancellationToken));

    [Authorize, ValidateAntiForgeryToken]
    [HttpPost]
    public async Task<ActionResult<ProductReviewResponse>> Create(int productId, CreateReviewRequest request, CancellationToken cancellationToken)
    {
        var user = await users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        if (!await context.Products.AnyAsync(product => product.Id == productId, cancellationToken)) return NotFound();
        var purchased = await context.OrderItems.AnyAsync(item => item.ProductId == productId && item.Order.CustomerId == user.Id && item.Order.Status != OrderStatus.Cancelled, cancellationToken);
        if (!purchased) return Forbid();
        if (await context.ProductReviews.AnyAsync(review => review.ProductId == productId && review.CustomerId == user.Id, cancellationToken)) return Conflict();
        var review = new ProductReview { ProductId = productId, CustomerId = user.Id, Rating = request.Rating, Comment = request.Comment.Trim(), CreatedAt = DateTimeOffset.UtcNow };
        context.ProductReviews.Add(review);
        await context.SaveChangesAsync(cancellationToken);
        return StatusCode(StatusCodes.Status201Created, new ProductReviewResponse { Id = review.Id, Rating = review.Rating, Comment = review.Comment, CreatedAt = review.CreatedAt, CustomerName = user.FullName ?? user.Email! });
    }

    [Authorize, ValidateAntiForgeryToken]
    [HttpPut("{reviewId:int}")]
    public async Task<IActionResult> Update(int productId, int reviewId, UpdateReviewRequest request, CancellationToken cancellationToken)
    {
        var userId = users.GetUserId(User);
        var review = await context.ProductReviews.FirstOrDefaultAsync(item => item.Id == reviewId && item.ProductId == productId && item.CustomerId == userId, cancellationToken);
        if (review is null) return NotFound();
        review.Rating = request.Rating; review.Comment = request.Comment.Trim(); review.UpdatedAt = DateTimeOffset.UtcNow;
        await context.SaveChangesAsync(cancellationToken); return NoContent();
    }

    [Authorize, ValidateAntiForgeryToken]
    [HttpDelete("{reviewId:int}")]
    public async Task<IActionResult> Delete(int productId, int reviewId, CancellationToken cancellationToken)
    {
        var userId = users.GetUserId(User);
        var review = await context.ProductReviews.FirstOrDefaultAsync(item => item.Id == reviewId && item.ProductId == productId && item.CustomerId == userId, cancellationToken);
        if (review is null) return NotFound();
        context.ProductReviews.Remove(review); await context.SaveChangesAsync(cancellationToken); return NoContent();
    }
}

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/admin/reviews")]
public sealed class AdminReviewsController(AppDbContext context) : ControllerBase
{
    [ValidateAntiForgeryToken]
    [HttpPut("{id:int}/visibility")]
    public async Task<IActionResult> SetVisibility(int id, ModerateReviewRequest request, CancellationToken cancellationToken)
    {
        var review = await context.ProductReviews.FindAsync([id], cancellationToken);
        if (review is null) return NotFound();
        review.IsVisible = request.IsVisible; await context.SaveChangesAsync(cancellationToken); return NoContent();
    }
}
