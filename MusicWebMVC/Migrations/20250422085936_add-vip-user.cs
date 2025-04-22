using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MusicWebMVC.Migrations
{
    /// <inheritdoc />
    public partial class addvipuser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsVIP",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsVIP",
                table: "Users");
        }
    }
}
