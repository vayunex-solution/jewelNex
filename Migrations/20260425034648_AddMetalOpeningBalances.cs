using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JewelleryApp.Migrations
{
    /// <inheritdoc />
    public partial class AddMetalOpeningBalances : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Columns already exist in DB
            /*
            migrationBuilder.AddColumn<decimal>(
                name: "OpeningGold",
                table: "Customers",
                type: "decimal(10, 3)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "OpeningSilver",
                table: "Customers",
                type: "decimal(10, 3)",
                nullable: false,
                defaultValue: 0m);
            */
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            /*
            migrationBuilder.DropColumn(
                name: "OpeningGold",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "OpeningSilver",
                table: "Customers");
            */
        }
    }
}
