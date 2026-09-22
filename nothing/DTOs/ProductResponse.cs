using nothing.Models;

namespace nothing.DTOs;

public class ProductResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public decimal? ScreenSizeInches { get; set; }
    public string? Resolution { get; set; }
    public int BrandId { get; set; }
    public string Brand { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }

    public static ProductResponse FromProduct(Product product)
    {
        return new ProductResponse
        {
            Id = product.Id,
            Name = product.Name,
            ImageUrl = product.ImageUrl,
            ScreenSizeInches = product.ScreenSizeInches,
            Resolution = product.Resolution,
            BrandId = product.BrandId,
            Brand = product.Brand.Name,
            Price = product.Price,
            Stock = product.Stock
        };
    }
}
