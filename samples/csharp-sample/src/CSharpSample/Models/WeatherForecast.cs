namespace CSharpSample.Models;

/// <summary>
/// 天気予報を表すドメインモデル。
/// </summary>
public record WeatherForecast(
    int Id,
    DateOnly Date,
    int TemperatureC,
    string? Summary
)
{
    /// <summary>
    /// 摂氏から華氏への変換値。
    /// </summary>
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

/// <summary>
/// 天気予報をメモリに保持する簡易ストア。
/// 本番では EF Core + DB バックエンドに置き換える想定。
/// </summary>
public class WeatherForecastStore
{
    private readonly List<WeatherForecast> _items = new();
    private int _nextId = 1;
    private readonly object _lock = new();

    public IEnumerable<WeatherForecast> GetAll()
    {
        lock (_lock)
        {
            return _items.ToArray();
        }
    }

    public WeatherForecast? FindById(int id)
    {
        lock (_lock)
        {
            return _items.FirstOrDefault(x => x.Id == id);
        }
    }

    public WeatherForecast Add(WeatherForecast forecast)
    {
        lock (_lock)
        {
            var created = forecast with { Id = _nextId++ };
            _items.Add(created);
            return created;
        }
    }

    public bool Remove(int id)
    {
        lock (_lock)
        {
            var target = _items.FirstOrDefault(x => x.Id == id);
            if (target is null) return false;
            _items.Remove(target);
            return true;
        }
    }
}
