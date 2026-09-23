using Microsoft.EntityFrameworkCore;
using nothing.Data;
using nothing.DTOs;

namespace nothing.Services;

public class ProductService
{
    private readonly AppDbContext _context;

    public ProductService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ProductPageResponse> GetProductsAsync(
        ProductQueryRequest request,
        CancellationToken cancellationToken)
    {
        var query = _context.Products.AsQueryable();

        if (request.BrandId.HasValue)
        {
            query = query.Where(product => product.BrandId == request.BrandId.Value);
        }

        var search = request.Search?.Trim();
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(product => product.Name.Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var products = await query
            .OrderBy(product => product.Id)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(product => new ProductResponse
            {
                Id = product.Id,
                Name = product.Name,
                ImageUrl = product.ImageUrl,
                ScreenSizeInches = product.ScreenSizeInches,
                Resolution = product.Resolution,
                BrandId = product.BrandId,
                Brand = product.Brand.Name,
                Price = product.Price,
                Stock = product.Stock,
                RowVersion = product.RowVersion
            })
            .ToListAsync(cancellationToken);

        return new ProductPageResponse
        {
            Items = products,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}
