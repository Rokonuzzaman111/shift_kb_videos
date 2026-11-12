# Render the full reel on a low-RAM laptop: bundle once, render video in short muted chunks
# (one browser tab, fresh per chunk), render the audio once, then mux.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\render_full.ps1 [-Scale 0.4] [-Crf 28] [-Chunk 150]
param([double]$Scale = 0.4, [int]$Crf = 28, [int]$Chunk = 150, [string]$Comp = "RooppurFull", [switch]$Rebundle)
Set-Location (Split-Path $PSScriptRoot -Parent)
$dir = "out\$($Comp)_$Scale"
New-Item -ItemType Directory -Force $dir | Out-Null

if ($Rebundle -or -not (Test-Path "build\index.html")) {
  cmd /c "npx remotion bundle --out-dir=build --log=error 2>&1"
}
$line = (cmd /c "npx remotion compositions build 2>&1" | Select-String "^$Comp\s" | Select-Object -First 1).Line
# e.g. "RooppurFull   30   1080x1920   5773 (192.43 sec)"
$total = if ($line -match "\s(\d+)\s+\(") { [int]$Matches[1] } else { 0 }
if (-not $total) { Write-Output "could not read duration: $line"; exit 1 }
Write-Output "frames: $total"

$list = @()
$i = 0
for ($s = 0; $s -lt $total; $s += $Chunk) {
  $e = [math]::Min($s + $Chunk - 1, $total - 1)
  $f = "$dir\v_$('{0:d3}' -f $i).mp4"
  if (-not (Test-Path $f)) {
    cmd /c "npx remotion render build $Comp $f --frames=$s-$e --muted --scale=$Scale --crf=$Crf --jpeg-quality=75 --gl=angle --concurrency=1 --log=error 2>&1" | Select-String "Error"
    if (-not (Test-Path $f)) { Write-Output "chunk $s-$e failed, retrying once"; cmd /c "npx remotion render build $Comp $f --frames=$s-$e --muted --scale=$Scale --crf=$Crf --jpeg-quality=75 --gl=angle --concurrency=1 --log=error 2>&1" | Select-String "Error" }
    if (-not (Test-Path $f)) { Write-Output "chunk $s-$e failed"; exit 1 }
  }
  Write-Output "chunk $i ok ($s-$e)"
  $list += "file 'v_$('{0:d3}' -f $i).mp4'"
  $i++
}
$list | Set-Content "$dir\list.txt" -Encoding ascii

if (-not (Test-Path "$dir\audio.wav")) {
  $audioComp = if ($Comp -eq "CaffeineFull") { "CaffeineAudio" } else { $Comp }
  cmd /c "npx remotion render build $audioComp $dir\audio.wav --codec=wav --concurrency=1 --log=error 2>&1" | Select-String "Error"
}
ffmpeg -v error -y -f concat -safe 0 -i "$dir\list.txt" -c copy "$dir\video.mp4"
ffmpeg -v error -y -i "$dir\video.mp4" -i "$dir\audio.wav" -c:v copy -c:a aac -b:a 160k -shortest "out\$($Comp)_$Scale.mp4"
Get-Item "out\$($Comp)_$Scale.mp4" | Select-Object Name, Length
