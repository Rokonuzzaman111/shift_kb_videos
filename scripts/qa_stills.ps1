# Render QA stills per shot (at given % of each shot) and tile them into a contact sheet.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\qa_stills.ps1 -Out <dir> [-Pct 45] [-Only "S01-Hook,S05-Reactor"]
param([string]$Out, [int]$Pct = 45, [string]$Only = "")
Set-Location (Split-Path $PSScriptRoot -Parent)
New-Item -ItemType Directory -Force $Out | Out-Null
# approximate shot lengths in seconds (see src/FullVideo.tsx)
$secs = [ordered]@{
  "S01-Hook"=9.17; "S03-Pellet"=8.8; "S05-Reactor"=14.0; "S09-Fission"=17; "S10-Chain"=11.65; "S11-Myth"=15.89;
  "S12-Control"=10.8; "S13-Scram"=7.6; "S14-Loop"=8.0; "S15-Pressure"=9.5; "S16-Steam-generator"=11.7; "S17-Turbine"=6.9;
  "S18-Generator"=9.8; "S19-Dynamo"=4.1; "S20-City"=5.6; "S21-Cooling"=5.86; "S22-Condenser"=6.84; "S23-Safety"=12.3;
  "S24-Catcher"=7.6; "S25-Ending"=9.25
}
$ids = if ($Only) { $Only.Split(",") } else { @($secs.Keys) }
$files = @()
foreach ($id in $ids) {
  $f = "$Out\$id-$Pct.jpg"
  $frame = [math]::Floor($secs[$id] * 30 * $Pct / 100)
  if (-not (Test-Path $f)) {
    cmd /c "npx remotion still $id $f --frame=$frame --scale=0.25 --gl=angle --log=error 2>&1" | Select-String "Error"
  }
  if (Test-Path $f) { $files += $f } else { Write-Output "MISSING $id" }
}
Add-Type -AssemblyName System.Drawing
$w = 270; $h = 480; $cols = 5; $rows = [math]::Ceiling($files.Count / $cols)
$sheet = New-Object Drawing.Bitmap ($w * $cols), ($h * $rows)
$g = [Drawing.Graphics]::FromImage($sheet)
$font = New-Object Drawing.Font "Arial", 14
for ($i = 0; $i -lt $files.Count; $i++) {
  $img = [Drawing.Image]::FromFile($files[$i])
  $x = ($i % $cols) * $w; $y = [math]::Floor($i / $cols) * $h
  $g.DrawImage($img, $x, $y, $w, $h)
  $g.DrawString([IO.Path]::GetFileNameWithoutExtension($files[$i]), $font, [Drawing.Brushes]::Yellow, $x + 4, $y + 4)
  $img.Dispose()
}
$sheet.Save("$Out\sheet-$Pct.jpg", [Drawing.Imaging.ImageFormat]::Jpeg)
Write-Output "sheet: $Out\sheet-$Pct.jpg"
