using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace nothing.Migrations
{
    /// <inheritdoc />
    public partial class AddReviewVisibility : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsVisible",
                table: "ProductReviews",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsVisible",
                table: "ProductReviews");
        }
    }
}
