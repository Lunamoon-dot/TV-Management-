using System.ComponentModel.DataAnnotations;

namespace nothing.DTOs;

public class ProductQueryRequest
{
    [Range(1, int.MaxValue)]
    public int? BrandId { get; set; }

    [StringLength(200)]
    public string? Search { get; set; }

    [Range(1, 1000000)]
    public int Page { get; set; } = 1;

    [Range(1, 100)]
    public int PageSize { get; set; } = 20;
}
