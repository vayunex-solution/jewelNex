using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JewelleryApp.Migrations
{
    /// <inheritdoc />
    public partial class AddTodayRateToVoucher : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "TodayRate",
                table: "Vouchers",
                type: "decimal(18, 2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TodayRate",
                table: "Vouchers");
        }
    }
}
