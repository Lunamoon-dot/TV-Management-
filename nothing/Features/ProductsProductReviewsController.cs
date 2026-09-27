using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using nothing.Data;
using nothing.Models;

namespace nothing.Features.Products;

[ApiController]
[Route("api/products/{productId:int}/reviews")]
public sealed class ProductReviewsController(AppDbContext context, UserManager<ApplicationUser> users) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductReviewResponse>>> Get(int productId, CancellationToken cancellationToken) => Ok(
        await context.ProductReviews.Where(review => review.ProductId == productId).OrderByDescending(review => review.CreatedAt).Select(review => new ProductReviewResponse
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
}
