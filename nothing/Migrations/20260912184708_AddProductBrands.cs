using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace nothing.Migrations
{
    /// <inheritdoc />
    public partial class AddProductBrands : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF EXISTS (
                    SELECT 1 FROM [Products]
                    WHERE LEN(LTRIM(RTRIM([Brand]))) = 0 OR DATALENGTH([Brand]) > 200
                )
                    THROW 50001, 'Existing brand names must be nonblank and at most 100 characters.', 1;
                """);

            migrationBuilder.AddColumn<int>(
                name: "BrandId",
                table: "Products",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Brands",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Brands", x => x.Id);
                });

            // Preserve existing brand names before removing the old column.
            migrationBuilder.Sql("""
                EXEC(N'
                INSERT INTO [Brands] ([Name])
                SELECT DISTINCT [Brand] FROM [Products] ORDER BY [Brand];

                UPDATE p
                SET p.[BrandId] = b.[Id]
                FROM [Products] AS p
                INNER JOIN [Brands] AS b ON p.[Brand] = b.[Name];

                IF EXISTS (SELECT 1 FROM [Products] WHERE [BrandId] IS NULL)
                    THROW 50002, ''Some products could not be linked to a brand.'', 1;
                ');
                """);

            migrationBuilder.AlterColumn<int>(
                name: "BrandId",
                table: "Products",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Products_BrandId",
                table: "Products",
                column: "BrandId");

            migrationBuilder.CreateIndex(
                name: "IX_Brands_Name",
                table: "Brands",
                column: "Name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Brands_BrandId",
                table: "Products",
                column: "BrandId",
                principalTable: "Brands",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.DropColumn(
                name: "Brand",
                table: "Products");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Brand",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.Sql("""
                EXEC(N'
                UPDATE p
                SET p.[Brand] = b.[Name]
                FROM [Products] AS p
                INNER JOIN [Brands] AS b ON p.[BrandId] = b.[Id];
                ');
                """);

            migrationBuilder.AlterColumn<string>(
                name: "Brand",
                table: "Products",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.DropForeignKey(
                name: "FK_Products_Brands_BrandId",
                table: "Products");

            migrationBuilder.DropTable(
                name: "Brands");

            migrationBuilder.DropIndex(
                name: "IX_Products_BrandId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "BrandId",
                table: "Products");

        }
    }
}
