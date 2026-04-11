using Microsoft.AspNetCore.Mvc;
using CSharpSample.Models;

namespace CSharpSample.Controllers;

/// <summary>
/// 天気予報 API。サンプル用のシンプルな CRUD を提供する。
/// </summary>
[ApiController]
[Route("[controller]")]
public class WeatherController : ControllerBase
{
    private readonly WeatherForecastStore _store;

    public WeatherController(WeatherForecastStore store)
    {
        _store = store;
    }

    /// <summary>
    /// 登録されている全ての天気予報を取得する。
    /// </summary>
    [HttpGet]
    public ActionResult<IEnumerable<WeatherForecast>> GetAll()
    {
        return Ok(_store.GetAll());
    }

    /// <summary>
    /// 指定 ID の天気予報を取得する。見つからなければ 404 を返す。
    /// </summary>
    [HttpGet("{id:int}")]
    public ActionResult<WeatherForecast> GetById(int id)
    {
        var forecast = _store.FindById(id);
        if (forecast is null)
        {
            return NotFound();
        }
        return Ok(forecast);
    }

    /// <summary>
    /// 新しい天気予報を追加する。
    /// </summary>
    [HttpPost]
    public ActionResult<WeatherForecast> Create([FromBody] WeatherForecast forecast)
    {
        var created = _store.Add(forecast);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// 指定 ID の天気予報を削除する。
    /// </summary>
    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        var removed = _store.Remove(id);
        return removed ? NoContent() : NotFound();
    }
}
