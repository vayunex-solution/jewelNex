using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JewelleryApp.Migrations
{
    /// <inheritdoc />
    public partial class AddBhavCutFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "BhavCutCash",
                table: "Invoices",
                type: "decimal(18, 2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "BhavCutMetalType",
                table: "Invoices",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BhavCutRate",
                table: "Invoices",
                type: "decimal(18, 2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "BhavCutWeight",
                table: "Invoices",
                type: "decimal(10, 3)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 29, 7, 17, 3, 751, DateTimeKind.Local).AddTicks(3946));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 29, 7, 17, 3, 752, DateTimeKind.Local).AddTicks(8564));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 3,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 29, 7, 17, 3, 752, DateTimeKind.Local).AddTicks(8599));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 4,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 29, 7, 17, 3, 752, DateTimeKind.Local).AddTicks(8602));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 5,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 29, 7, 17, 3, 752, DateTimeKind.Local).AddTicks(8604));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 6,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 29, 7, 17, 3, 752, DateTimeKind.Local).AddTicks(8605));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 7,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 29, 7, 17, 3, 752, DateTimeKind.Local).AddTicks(8607));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 8,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 29, 7, 17, 3, 752, DateTimeKind.Local).AddTicks(8609));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 9,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 29, 7, 17, 3, 752, DateTimeKind.Local).AddTicks(8611));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 10,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 29, 7, 17, 3, 752, DateTimeKind.Local).AddTicks(8612));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 11,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 29, 7, 17, 3, 752, DateTimeKind.Local).AddTicks(8614));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 12,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 29, 7, 17, 3, 752, DateTimeKind.Local).AddTicks(8616));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 13,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 29, 7, 17, 3, 752, DateTimeKind.Local).AddTicks(8618));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 14,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 29, 7, 17, 3, 752, DateTimeKind.Local).AddTicks(8620));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 15,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 29, 7, 17, 3, 752, DateTimeKind.Local).AddTicks(8622));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 16,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 29, 7, 17, 3, 752, DateTimeKind.Local).AddTicks(8624));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 17,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 29, 7, 17, 3, 752, DateTimeKind.Local).AddTicks(8626));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 18,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 29, 7, 17, 3, 752, DateTimeKind.Local).AddTicks(8628));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BhavCutCash",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "BhavCutMetalType",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "BhavCutRate",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "BhavCutWeight",
                table: "Invoices");

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 27, 12, 5, 7, 693, DateTimeKind.Local).AddTicks(9449));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 27, 12, 5, 7, 696, DateTimeKind.Local).AddTicks(4529));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 3,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 27, 12, 5, 7, 696, DateTimeKind.Local).AddTicks(4581));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 4,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 27, 12, 5, 7, 696, DateTimeKind.Local).AddTicks(4585));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 5,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 27, 12, 5, 7, 696, DateTimeKind.Local).AddTicks(4587));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 6,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 27, 12, 5, 7, 696, DateTimeKind.Local).AddTicks(4590));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 7,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 27, 12, 5, 7, 696, DateTimeKind.Local).AddTicks(4593));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 8,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 27, 12, 5, 7, 696, DateTimeKind.Local).AddTicks(4596));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 9,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 27, 12, 5, 7, 696, DateTimeKind.Local).AddTicks(4598));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 10,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 27, 12, 5, 7, 696, DateTimeKind.Local).AddTicks(4602));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 11,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 27, 12, 5, 7, 696, DateTimeKind.Local).AddTicks(4605));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 12,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 27, 12, 5, 7, 696, DateTimeKind.Local).AddTicks(4608));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 13,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 27, 12, 5, 7, 696, DateTimeKind.Local).AddTicks(4611));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 14,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 27, 12, 5, 7, 696, DateTimeKind.Local).AddTicks(4613));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 15,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 27, 12, 5, 7, 696, DateTimeKind.Local).AddTicks(4616));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 16,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 27, 12, 5, 7, 696, DateTimeKind.Local).AddTicks(4619));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 17,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 27, 12, 5, 7, 696, DateTimeKind.Local).AddTicks(4651));

            migrationBuilder.UpdateData(
                table: "ItemsMaster",
                keyColumn: "Id",
                keyValue: 18,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 27, 12, 5, 7, 696, DateTimeKind.Local).AddTicks(4654));
        }
    }
}
