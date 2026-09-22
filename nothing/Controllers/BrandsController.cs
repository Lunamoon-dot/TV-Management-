using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using nothing.Data;
using nothing.DTOs;

namespace nothing.Controllers
{
    [ApiController]
    [Route("api/brands")]
    public class BrandsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BrandsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<BrandResponse>>> Get(CancellationToken cancellationToken)
        {
            var brands = await _context.Brands
                .AsNoTracking()
                .OrderBy(brand => brand.Name)
                .Select(brand => new BrandResponse { Id = brand.Id, Name = brand.Name })
                .ToListAsync(cancellationToken);

            return Ok(brands);
        }
    }
}
