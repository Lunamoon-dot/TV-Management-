using Microsoft.EntityFrameworkCore;
using nothing.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace nothing.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Product> Products { get; set; }

    public DbSet<Brand> Brands { get; set; }

    public DbSet<Order> Orders { get; set; }

    public DbSet<OrderItem> OrderItems { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Brand>()
            .Property(brand => brand.Name)
            .HasMaxLength(100)
            .IsRequired();

        modelBuilder.Entity<Brand>()
            .HasIndex(brand => brand.Name)
            .IsUnique();

        modelBuilder.Entity<Product>()
            .HasOne(product => product.Brand)
            .WithMany()
            .HasForeignKey(product => product.BrandId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Product>()
            .Property(product => product.Price)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Order>()
            .HasOne(order => order.Customer)
            .WithMany()
            .HasForeignKey(order => order.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Order>()
            .HasIndex(order => new { order.CustomerId, order.CheckoutId })
            .IsUnique()
            .HasFilter("[CheckoutId] IS NOT NULL");

        modelBuilder.Entity<Order>()
            .Property(order => order.TotalAmount)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Order>()
            .Property(order => order.RecipientName)
            .HasMaxLength(100)
            .IsRequired();

        modelBuilder.Entity<Order>()
            .Property(order => order.PhoneNumber)
            .HasMaxLength(20)
            .IsRequired();

        modelBuilder.Entity<Order>()
            .Property(order => order.ShippingAddress)
            .HasMaxLength(300)
            .IsRequired();

        modelBuilder.Entity<Order>()
            .Property(order => order.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        modelBuilder.Entity<OrderItem>()
            .HasOne(item => item.Order)
            .WithMany(order => order.Items)
            .HasForeignKey(item => item.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderItem>()
            .HasOne(item => item.Product)
            .WithMany()
            .HasForeignKey(item => item.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<OrderItem>()
            .Property(item => item.ProductName)
            .HasMaxLength(200)
            .IsRequired();

        modelBuilder.Entity<OrderItem>()
            .Property(item => item.BrandName)
            .HasMaxLength(100)
            .IsRequired();

        modelBuilder.Entity<OrderItem>()
            .Property(item => item.UnitPrice)
            .HasPrecision(18, 2);

        modelBuilder.Entity<OrderItem>()
            .Property(item => item.LineTotal)
            .HasPrecision(18, 2);
    }
}
