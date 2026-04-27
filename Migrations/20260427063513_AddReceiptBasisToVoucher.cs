using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JewelleryApp.Migrations
{
    /// <inheritdoc />
    public partial class AddReceiptBasisToVoucher : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Basis",
                table: "Vouchers",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Basis",
                table: "Vouchers");
        }
    }
}
