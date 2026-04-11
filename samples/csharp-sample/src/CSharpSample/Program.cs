using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using CSharpSample.Models;

var builder = WebApplication.CreateBuilder(args);

// サービス登録
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// In-memory の天気予報データストアをシングルトンとして登録
builder.Services.AddSingleton<WeatherForecastStore>();

var app = builder.Build();

// 開発環境では Swagger UI を有効化
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers();

app.Run();
