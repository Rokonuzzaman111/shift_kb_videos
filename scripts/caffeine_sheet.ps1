# Review contact sheet for the caffeine reel: 3 stills per shot (at 20%, 55%, 88%), 9 shots.
# Rows = shots, columns = moments. Output: out\review\caffeine_sheet.jpg
# Usage: powershell -ExecutionPolicy Bypass -File scripts\caffeine_sheet.ps1
Set-Location (Split-Path $PSScriptRoot -Parent)
$dir = "out\review"
New-Item -ItemType Directory -Force $dir | Out-Null
$pcts = 20, 55, 88
$comps = cmd /c "npx remotion compositions src/index.ts 2>&1" | Select-String "^C-SH\d" | % {
  if ($_.Line -match "^(C-SH\S+)\s+\d+\s+\S+\s+(\d+)") { [pscustomobject]@{ id = $Matches[1]; frames = [int]$Matches[2] } }
}
$files = @()
foreach ($c in $comps) {
  foreach ($p in $pcts) {
    $f = "$dir\$($c.id)-$p.jpg"
    $frame = [math]::Floor($c.frames * $p / 100)
    if (-not (Test-Path $f)) {
      cmd /c "npx remotion still src/index.ts $($c.id) $f --frame=$frame --scale=0.25 --gl=angle --log=error 2>&1" | Select-String "Error"
    }
    $files += $f
  }
  Write-Output "$($c.id) done"
}
Add-Type -AssemblyName System.Drawing
$w = 270; $h = 480; $cols = $pcts.Count; $label = 150
$rows = $comps.Count
$sheet = New-Object Drawing.Bitmap ($label + $w * $cols), ($h * $rows)
$g = [Drawing.Graphics]::FromImage($sheet)
$g.Clear([Drawing.Color]::FromArgb(20, 14, 10))
$font = New-Object Drawing.Font "Arial", 18, ([Drawing.FontStyle]::Bold)
for ($r = 0; $r -lt $rows; $r++) {
  $g.DrawString($comps[$r].id.Replace("C-", ""), $font, [Drawing.Brushes]::Gold, 8, $r * $h + 12)
  for ($k = 0; $k -lt $cols; $k++) {
    $f = $files[$r * $cols + $k]
    if (Test-Path $f) {
      $img = [Drawing.Image]::FromFile((Resolve-Path $f))
      $g.DrawImage($img, $label + $k * $w, $r * $h, $w, $h)
      $img.Dispose()
    }
  }
}
$sheet.Save("$((Resolve-Path $dir).Path)\caffeine_sheet.jpg", [Drawing.Imaging.ImageFormat]::Jpeg)
Write-Output "sheet: $dir\caffeine_sheet.jpg"
