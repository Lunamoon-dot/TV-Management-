namespace nothing.Models;

public class Product
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    public decimal? ScreenSizeInches { get; set; }

    public string? Resolution { get; set; }

    public int BrandId { get; set; }

    public Brand Brand { get; set; } = null!;

    public decimal Price { get; set; }

    public int Stock { get; set; }

    public byte[] RowVersion { get; set; } = [];
}
