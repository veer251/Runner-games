# Generic local HTTP server for the FPP runner games.
# Usage: copy into the game folder, then run:  powershell -ExecutionPolicy Bypass -File start-server.ps1 [-Port 8090]
param([int]$Port = 8090)
$path = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try {
    $listener.Start()
    Write-Host "Game server running at http://localhost:$Port/   (Ctrl+C to stop)"
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $response = $context.Response
        $localPath = [System.Uri]::UnescapeDataString($context.Request.Url.LocalPath)
        if ($localPath -eq "/" -or $localPath -eq "") { $localPath = "/index.html" }
        $filePath = Join-Path $path ($localPath.TrimStart('/').Replace('/', '\'))

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".webp" { "image/webp" }
                ".mp3"  { "audio/mpeg" }
                ".wav"  { "audio/wav" }
                ".ogg"  { "audio/ogg" }
                default { "application/octet-stream" }
            }
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $contentType
            $response.Headers.Add("Cache-Control", "no-store, no-cache, must-revalidate")
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($notFound, 0, $notFound.Length)
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
}
