# Storyboard sheets for review: 3 frames per shot (start / middle / end), 5 shots per sheet.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\make_sheets.ps1
Set-Location (Split-Path $PSScriptRoot -Parent)
$frames = "out\sheets\frames"
New-Item -ItemType Directory -Force $frames | Out-Null
$secs = [ordered]@{
  "S01-Hook"=9.17; "S03-Pellet"=8.8; "S05-Reactor"=14.0; "S09-Fission"=17; "S10-Chain"=11.65; "S11-Myth"=15.89;
  "S12-Control"=10.8; "S13-Scram"=7.6; "S14-Loop"=8.0; "S15-Pressure"=9.5; "S16-Steam-generator"=11.7; "S17-Turbine"=6.9;
  "S18-Generator"=9.8; "S19-Dynamo"=4.1; "S20-City"=5.6; "S21-Cooling"=5.86; "S22-Condenser"=6.84; "S23-Safety"=12.3;
  "S24-Catcher"=7.6; "S25-Ending"=9.25
}
$pcts = @(20, 55, 88)
if (-not (Test-Path "build\index.html")) { cmd /c "npx remotion bundle --out-dir=build --log=error 2>&1" | Out-Null }
foreach ($id in $secs.Keys) {
  foreach ($p in $pcts) {
    $f = "$frames\$id-$p.jpg"
    if (Test-Path $f) { continue }
    $frame = [math]::Floor($secs[$id] * 30 * $p / 100)
    cmd /c "npx remotion still build $id $f --frame=$frame --scale=0.25 --gl=angle --log=error 2>&1" | Select-String "Error"
  }
  Write-Output "frames ok: $id"
}
Add-Type -AssemblyName System.Drawing
$ids = @($secs.Keys)
$w = 270; $h = 480; $label = 34
$font = New-Object Drawing.Font "Arial", 15, ([Drawing.FontStyle]::Bold)
for ($sheetNo = 0; $sheetNo -lt 4; $sheetNo++) {
  $rows = $ids[($sheetNo * 5)..([math]::Min($sheetNo * 5 + 4, $ids.Count - 1))]
  $bmp = New-Object Drawing.Bitmap ($w * 3), (($h + $label) * $rows.Count)
  $g = [Drawing.Graphics]::FromImage($bmp)
  $g.Clear([Drawing.Color]::FromArgb(20, 22, 28))
  for ($r = 0; $r -lt $rows.Count; $r++) {
    $y = $r * ($h + $label)
    $g.DrawString("$($rows[$r])   (shuru / majh / shesh)", $font, [Drawing.Brushes]::Gold, 8, $y + 6)
    for ($c = 0; $c -lt 3; $c++) {
      $f = "$frames\$($rows[$r])-$($pcts[$c]).jpg"
      if (Test-Path $f) {
        $img = [Drawing.Image]::FromFile((Resolve-Path $f))
        $g.DrawImage($img, $c * $w, $y + $label, $w, $h)
        $img.Dispose()
      }
    }
  }
  $out = "out\sheets\rooppur_sheet_$($sheetNo + 1).jpg"
  $bmp.Save((Join-Path (Get-Location) $out), [Drawing.Imaging.ImageFormat]::Jpeg)
  $g.Dispose(); $bmp.Dispose()
  Write-Output "sheet: $out"
}
