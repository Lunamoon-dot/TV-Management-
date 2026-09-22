namespace nothing.Models;

public class Product
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int BrandId { get; set; }

    public Brand Brand { get; set; } = null!;

    public decimal Price { get; set; }

    public int Stock { get; set; }
}
