# Builds a launcher .exe for a browser game folder.
# Default: the exe is placed INSIDE the game folder and serves the game files from that folder (files stay separate & editable).
# -Embed: also packs all files into the exe (portable single file).
# Usage: powershell -ExecutionPolicy Bypass -File build-exe.ps1 -GameDir "<game folder>" [-Name "Game"] [-Out "<path\Game.exe>"] [-Embed]
param(
  [Parameter(Mandatory = $true)][string]$GameDir,
  [string]$Name = "Play",
  [string]$Out = "",
  [switch]$Embed
)
$ErrorActionPreference = 'Stop'
$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) { $csc = "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe" }
$src = Join-Path $PSScriptRoot "Launcher.cs"
$GameDir = (Resolve-Path $GameDir).Path.TrimEnd('\')
if (-not $Out) { $Out = Join-Path $GameDir "$Name.exe" }

$cargs = @('/nologo', '/target:winexe', '/optimize+', "/out:$Out", '/r:System.Windows.Forms.dll')
$ico = Join-Path $GameDir 'icon.ico'
if (Test-Path $ico) { $cargs += "/win32icon:$ico" }

if ($Embed) {
  $skip = @('README.md', 'GUIDE.md', 'start-server.ps1', 'art-bible.md')
  Get-ChildItem -Path $GameDir -Recurse -File | Where-Object {
    $rel = $_.FullName.Substring($GameDir.Length + 1)
    -not ($skip -contains $_.Name) -and $rel -notmatch '^(launcher|dist|tools)\\' -and $_.Extension -notin @('.ico', '.exe')
  } | ForEach-Object {
    $rel = $_.FullName.Substring($GameDir.Length + 1).Replace('\', '/')
    $cargs += "/resource:$($_.FullName),$rel"
  }
}
$cargs += $src
& $csc @cargs
if ($LASTEXITCODE -ne 0) { throw "csc failed ($LASTEXITCODE)" }
Write-Host "Built: $Out  ($([math]::Round((Get-Item $Out).Length / 1KB, 1)) KB)  embed=$Embed"
