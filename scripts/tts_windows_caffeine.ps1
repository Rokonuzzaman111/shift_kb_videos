# Caffeine reel VO with the Windows default voice (System.Speech). Windows has no Bangla voice here,
# so it reads a Banglish version (scripts/vo_banglish.json, same token count as the Bangla VO).
# Writes public/vo/caffeine/<key>.wav + <key>.win.json (per-token start ms); then
# scripts/merge_windows_vo.py puts those timings onto the Bangla tokens and makes the mp3s.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\tts_windows_caffeine.ps1
Set-Location (Split-Path $PSScriptRoot -Parent)
Add-Type -AssemblyName System.Speech
$data = Get-Content scripts\vo_banglish.json -Raw -Encoding UTF8 | ConvertFrom-Json
$out = "public\vo\caffeine"

foreach ($p in $data.PSObject.Properties) {
  $key = $p.Name
  $tokens = @($p.Value)
  $starts = @()
  $text = ""
  foreach ($tk in $tokens) {
    if ($text.Length) { $text += " " }
    $starts += $text.Length
    $text += $tk
  }
  $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $s.Rate = 3
  $script:ev = New-Object System.Collections.ArrayList
  $s.add_SpeakProgress({ param($sender, $e) [void]$script:ev.Add(@($e.CharacterPosition, $e.AudioPosition.TotalMilliseconds)) })
  $wav = (Resolve-Path $out).Path + "\$key.wav"
  $s.SetOutputToWaveFile($wav)
  $s.Speak($text)
  $s.SetOutputToNull()
  $s.Dispose()
  # token i starts at the first progress event whose char position falls inside that token
  $ms = @()
  for ($i = 0; $i -lt $tokens.Count; $i++) {
    $a = $starts[$i]
    $b = if ($i + 1 -lt $tokens.Count) { $starts[$i + 1] } else { 1e9 }
    $hit = $script:ev | Where-Object { $_[0] -ge $a -and $_[0] -lt $b } | Select-Object -First 1
    $ms += if ($hit) { [double]$hit[1] } else { -1 }
  }
  ($ms | ConvertTo-Json -Compress) | Set-Content "$out\$key.win.json" -Encoding ascii
  "$key tokens=$($tokens.Count) events=$($script:ev.Count) missing=$(@($ms | Where-Object { $_ -lt 0 }).Count)"
}
