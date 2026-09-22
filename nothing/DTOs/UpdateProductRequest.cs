using System.ComponentModel.DataAnnotations;

namespace nothing.DTOs;

public class UpdateProductRequest
{
    [Required]
    [RegularExpression(@"[\s\S]*\S[\s\S]*", ErrorMessage = "Name cannot contain only whitespace.")]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(2048)]
    [RegularExpression(@"^https?://.+", ErrorMessage = "Image URL must use HTTP or HTTPS.")]
    public string ImageUrl { get; set; } = string.Empty;

    [Range(typeof(decimal), "1", "200")]
    public decimal ScreenSizeInches { get; set; }

    [Required]
    [StringLength(50)]
    [RegularExpression(@"[\s\S]*\S[\s\S]*", ErrorMessage = "Resolution cannot contain only whitespace.")]
    public string Resolution { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int BrandId { get; set; }

    [Range(typeof(decimal), "0.01", "9999999999999999.99")]
    public decimal Price { get; set; }

    [Range(0, int.MaxValue)]
    public int Stock { get; set; }
}
