using System.ComponentModel.DataAnnotations;

namespace nothing.Features.Products;

public sealed class UpdateReviewRequest
{
    [Range(1, 5)] public int Rating { get; set; }
    [Required, StringLength(1000, MinimumLength = 5)] public string Comment { get; set; } = string.Empty;
}
