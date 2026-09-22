using System.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using nothing.Data;
using nothing.Models;

namespace nothing.Features.Orders;

[ApiController]
[Route("api/orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public OrdersController(AppDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult<OrderPageResponse>> GetMine(
        [FromQuery] OrderQueryRequest query,
        CancellationToken cancellationToken)
    {
        var userId = _userManager.GetUserId(User);
        if (userId is null) return Unauthorized();

        var orders = _context.Orders
            .Where(order => order.CustomerId == userId);

        var totalCount = await orders.CountAsync(cancellationToken);
        var items = await orders
            .OrderByDescending(order => order.CreatedAt)
            .ThenByDescending(order => order.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(order => new OrderResponse
            {
                Id = order.Id,
                CreatedAt = order.CreatedAt,
                Status = order.Status,
                TotalAmount = order.TotalAmount,
                Items = order.Items
                    .OrderBy(item => item.Id)
                    .Select(item => new OrderItemResponse
                    {
                        ProductId = item.ProductId,
                        ProductName = item.ProductName,
                        BrandName = item.BrandName,
                        UnitPrice = item.UnitPrice,
                        Quantity = item.Quantity,
                        LineTotal = item.LineTotal
                    }).ToList()
            })
            .ToListAsync(cancellationToken);

        return Ok(new OrderPageResponse
        {
            Items = items,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderResponse>> GetById(
        int id,
        CancellationToken cancellationToken)
    {
        var userId = _userManager.GetUserId(User);
        if (userId is null) return Unauthorized();

        var order = await _context.Orders
            .Where(order => order.Id == id && order.CustomerId == userId)
            .Select(order => new OrderResponse
            {
                Id = order.Id,
                CreatedAt = order.CreatedAt,
                Status = order.Status,
                TotalAmount = order.TotalAmount,
                Items = order.Items
                    .OrderBy(item => item.Id)
                    .Select(item => new OrderItemResponse
                    {
                        ProductId = item.ProductId,
                        ProductName = item.ProductName,
                        BrandName = item.BrandName,
                        UnitPrice = item.UnitPrice,
                        Quantity = item.Quantity,
                        LineTotal = item.LineTotal
                    }).ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        return order is null ? NotFound() : Ok(order);
    }

    [ValidateAntiForgeryToken]
    [HttpPost]
    public async Task<ActionResult<OrderResponse>> Create(
        CreateOrderRequest request,
        CancellationToken cancellationToken)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();

        var requestedItems = request.Items
            .GroupBy(item => item.ProductId)
            .Select(group => new
            {
                ProductId = group.Key,
                Quantity = group.Sum(item => item.Quantity)
            })
            .ToList();

        await using var transaction = await _context.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        var productIds = requestedItems.Select(item => item.ProductId).ToList();
        var products = await _context.Products
            .Include(product => product.Brand)
            .Where(product => productIds.Contains(product.Id))
            .ToDictionaryAsync(product => product.Id, cancellationToken);

        var order = new Order
        {
            CustomerId = user.Id,
            CreatedAt = DateTimeOffset.UtcNow
        };

        foreach (var requestedItem in requestedItems)
        {
            if (!products.TryGetValue(requestedItem.ProductId, out var product))
            {
                ModelState.AddModelError(nameof(request.Items), $"Product {requestedItem.ProductId} does not exist.");
                return ValidationProblem(ModelState);
            }

            if (product.Stock < requestedItem.Quantity)
            {
                ModelState.AddModelError(nameof(request.Items),
                    $"Product {product.Id} only has {product.Stock} item(s) in stock.");
                return ValidationProblem(ModelState);
            }

            var lineTotal = product.Price * requestedItem.Quantity;
            order.Items.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                BrandName = product.Brand.Name,
                UnitPrice = product.Price,
                Quantity = requestedItem.Quantity,
                LineTotal = lineTotal
            });

            order.TotalAmount += lineTotal;
            product.Stock -= requestedItem.Quantity;
        }

        _context.Orders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return StatusCode(StatusCodes.Status201Created, ToResponse(order));
    }

    private static OrderResponse ToResponse(Order order)
    {
        return new OrderResponse
        {
            Id = order.Id,
            CreatedAt = order.CreatedAt,
            Status = order.Status,
            TotalAmount = order.TotalAmount,
            Items = order.Items.Select(item => new OrderItemResponse
            {
                ProductId = item.ProductId,
                ProductName = item.ProductName,
                BrandName = item.BrandName,
                UnitPrice = item.UnitPrice,
                Quantity = item.Quantity,
                LineTotal = item.LineTotal
            }).ToList()
        };
    }
}
