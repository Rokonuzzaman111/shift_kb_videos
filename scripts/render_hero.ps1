# Render HeroPreview in shot-sized chunks (one browser tab, to fit in 8 GB RAM), then join them.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\render_hero.ps1 [-Scale 0.5] [-Crf 26]
# Note: no "$ErrorActionPreference = Stop" here: npm prints notices on stderr, which PowerShell 5
# would turn into a terminating error. Exit codes are checked instead.
param([double]$Scale = 0.5, [int]$Crf = 26)
Set-Location (Split-Path $PSScriptRoot -Parent)
# The fission shot is split into ~4s pieces: one long chunk runs Chrome out of memory on 8 GB.
$parts = @("0-269", "270-533", "534-660", "661-787", "788-914", "915-1043")
$dir = "out\parts_$Scale"
New-Item -ItemType Directory -Force $dir | Out-Null
$list = @()
$i = 0
foreach ($r in $parts) {
  $f = "$dir\hero_$i.mp4"
  if (-not (Test-Path $f)) {
    cmd /c "npx remotion render HeroPreview $f --frames=$r --scale=$Scale --crf=$Crf --jpeg-quality=80 --gl=angle --concurrency=1 --log=error 2>&1"
    if ($LASTEXITCODE -ne 0) { Write-Output "chunk $r failed ($LASTEXITCODE)"; exit 1 }
  }
  $list += "file 'hero_$i.mp4'"
  $i++
}
$list | Set-Content "$dir\list.txt" -Encoding ascii
ffmpeg -v error -y -f concat -safe 0 -i "$dir\list.txt" -c copy out\rooppur_hero_preview.mp4
Get-Item out\rooppur_hero_preview.mp4 | Select-Object Name, Length
