using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace nothing.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentSubmission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PaymentReference",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentRejectedReason",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "PaymentSubmittedAt",
                table: "Orders",
                type: "datetimeoffset",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentReference",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PaymentRejectedReason",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PaymentSubmittedAt",
                table: "Orders");
        }
    }
}
