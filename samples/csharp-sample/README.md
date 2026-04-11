# CSharpSample

これは **edge-cc の Attached Directory 機能の動作確認用サンプル** です。
実際に `dotnet build` する必要はありません。ファイル構造と内容が C# プロジェクトらしく見えることが目的です。

## 構成

```
csharp-sample/
├── CSharpSample.sln                        Visual Studio ソリューションファイル
├── README.md                               このファイル
└── src/
    └── CSharpSample/
        ├── CSharpSample.csproj             SDK スタイルの csproj (Microsoft.NET.Sdk.Web, net8.0)
        ├── Program.cs                      ASP.NET Core Minimal API のエントリポイント
        ├── Controllers/
        │   └── WeatherController.cs        サンプル Web API コントローラ
        └── Models/
            └── WeatherForecast.cs          ドメインモデルと In-memory ストア
```

## edge-cc での使い方

1. edge-cc の開発サーバを起動（`npm run dev`）
2. ブラウザで http://localhost:3000 を開く
3. Header の「📎 Directory をアタッチ」から、このサンプルの絶対パスを指定:
   `/Users/.../edge-cc/samples/csharp-sample`
4. Plan Mode を ON にして「このプロジェクトの概要を教えてください」と送信
5. エージェントが `list_files`、`scan_csproj`、`read_file` を使って構成を調査し、計画を立てる様子を観察

## 含まれる API（サンプル）

- `GET /weather`          全件取得
- `GET /weather/{id}`     ID 指定取得
- `POST /weather`         新規作成
- `DELETE /weather/{id}`  削除
