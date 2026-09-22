using System.ComponentModel.DataAnnotations;

namespace nothing.DTOs;

public class UpdateProductRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int BrandId { get; set; }

    [Range(typeof(decimal), "0.01", "9999999999999999.99")]
    public decimal Price { get; set; }

    [Range(0, int.MaxValue)]
    public int Stock { get; set; }
}
