using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace nothing.Migrations
{
    /// <inheritdoc />
    public partial class AddProductCatalogDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Products",
                type: "nvarchar(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Resolution",
                table: "Products",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ScreenSizeInches",
                table: "Products",
                type: "decimal(5,1)",
                precision: 5,
                scale: 1,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Resolution",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ScreenSizeInches",
                table: "Products");
        }
    }
}
