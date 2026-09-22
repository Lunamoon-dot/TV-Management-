using nothing.Models;

namespace nothing.DTOs;

public class ProductResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
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
            BrandId = product.BrandId,
            Brand = product.Brand.Name,
            Price = product.Price,
            Stock = product.Stock
        };
    }
}
