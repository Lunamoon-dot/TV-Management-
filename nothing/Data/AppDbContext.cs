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

    public DbSet<OrderStatusHistory> OrderStatusHistories { get; set; }

    public DbSet<OrderNote> OrderNotes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ApplicationUser>()
            .Property(user => user.FullName)
            .HasMaxLength(100);

        modelBuilder.Entity<ApplicationUser>()
            .Property(user => user.PhoneNumber)
            .HasMaxLength(20);

        modelBuilder.Entity<ApplicationUser>()
            .Property(user => user.ShippingAddress)
            .HasMaxLength(300);

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

        modelBuilder.Entity<Product>()
            .Property(product => product.ImageUrl)
            .HasMaxLength(2048);

        modelBuilder.Entity<Product>()
            .Property(product => product.ScreenSizeInches)
            .HasPrecision(5, 1);

        modelBuilder.Entity<Product>()
            .Property(product => product.Resolution)
            .HasMaxLength(50);

        modelBuilder.Entity<Product>()
            .Property(product => product.RowVersion)
            .IsRowVersion();

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

        modelBuilder.Entity<Order>()
            .Property(order => order.PaymentMethod)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        modelBuilder.Entity<Order>()
            .Property(order => order.PaymentStatus)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        modelBuilder.Entity<Order>()
            .Property(order => order.PaymentConfirmedByEmail)
            .HasMaxLength(256);

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

        modelBuilder.Entity<OrderStatusHistory>()
            .HasOne(history => history.Order)
            .WithMany(order => order.StatusHistory)
            .HasForeignKey(history => history.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderStatusHistory>()
            .Property(history => history.PreviousStatus)
            .HasConversion<string>()
            .HasMaxLength(20);

        modelBuilder.Entity<OrderStatusHistory>()
            .Property(history => history.NewStatus)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        modelBuilder.Entity<OrderStatusHistory>()
            .Property(history => history.ChangedByEmail)
            .HasMaxLength(256)
            .IsRequired();

        modelBuilder.Entity<OrderStatusHistory>()
            .Property(history => history.Reason)
            .HasMaxLength(300);

        modelBuilder.Entity<OrderStatusHistory>()
            .HasIndex(history => new { history.OrderId, history.ChangedAt });

        modelBuilder.Entity<OrderNote>()
            .HasOne(note => note.Order)
            .WithMany(order => order.Notes)
            .HasForeignKey(note => note.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderNote>()
            .Property(note => note.Content)
            .HasMaxLength(1000)
            .IsRequired();

        modelBuilder.Entity<OrderNote>()
            .Property(note => note.CreatedByEmail)
            .HasMaxLength(256)
            .IsRequired();

        modelBuilder.Entity<OrderNote>()
            .HasIndex(note => new { note.OrderId, note.CreatedAt });
    }
}
