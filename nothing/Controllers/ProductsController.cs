using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using nothing.Data;
using nothing.DTOs;
using nothing.Features.Auth;
using nothing.Models;
using nothing.Services;

namespace nothing.Controllers
{
    [ApiController]
    [Route("api/products")]
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ProductService _productService;

        public ProductsController(AppDbContext context, ProductService productService)
        {
            _context = context;
            _productService = productService;
        }

        [HttpGet]
        public async Task<ActionResult<ProductPageResponse>> Get(
            [FromQuery] ProductQueryRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _productService.GetProductsAsync(request, cancellationToken);
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ProductResponse>> GetById(int id, CancellationToken cancellationToken)
        {
            var product = await _context.Products
                .Where(product => product.Id == id)
                .Select(product => new ProductResponse
                {
                    Id = product.Id,
                    Name = product.Name,
                    BrandId = product.BrandId,
                    Brand = product.Brand.Name,
                    Price = product.Price,
                    Stock = product.Stock
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (product is null)
            {
                return NotFound();
            }

            return Ok(product);
        }

        [Authorize(Roles = AppRoles.Admin)]
        [ValidateAntiForgeryToken]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            UpdateProductRequest request,
            CancellationToken cancellationToken)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(product => product.Id == id, cancellationToken);

            if (product is null)
            {
                return NotFound();
            }

            if (!await _context.Brands.AnyAsync(brand => brand.Id == request.BrandId, cancellationToken))
            {
                ModelState.AddModelError(nameof(request.BrandId), "The selected brand does not exist.");
                return ValidationProblem(ModelState);
            }

            product.Name = request.Name.Trim();
            product.BrandId = request.BrandId;
            product.Price = request.Price;
            product.Stock = request.Stock;

            await _context.SaveChangesAsync(cancellationToken);

            return NoContent();
        }

        [Authorize(Roles = AppRoles.Admin)]
        [ValidateAntiForgeryToken]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(product => product.Id == id, cancellationToken);

            if (product is null)
            {
                return NotFound();
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync(cancellationToken);

            return NoContent();
        }

        [Authorize(Roles = AppRoles.Admin)]
        [ValidateAntiForgeryToken]
        [HttpPost]
        public async Task<ActionResult<ProductResponse>> Create(
            CreateProductRequest request,
            CancellationToken cancellationToken)
        {
            var brand = await _context.Brands
                .FirstOrDefaultAsync(brand => brand.Id == request.BrandId, cancellationToken);

            if (brand is null)
            {
                ModelState.AddModelError(nameof(request.BrandId), "The selected brand does not exist.");
                return ValidationProblem(ModelState);
            }

            var product = new Product
            {
                Name = request.Name.Trim(),
                BrandId = brand.Id,
                Brand = brand,
                Price = request.Price,
                Stock = request.Stock
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync(cancellationToken);

            return CreatedAtAction(nameof(GetById), new { id = product.Id }, ProductResponse.FromProduct(product));
        }
    }
}
