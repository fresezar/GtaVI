# Placeholder voices for the joke shorts (Windows SAPI). Called by render.mjs.
#   powershell -File tts.ps1 -List items.json -OutDir dir   (items: [{id, text, voice, rate}])
param([string]$List, [string]$OutDir)
Add-Type -AssemblyName System.Speech
$items = Get-Content -Raw -Encoding UTF8 $List | ConvertFrom-Json
$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(24000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
foreach ($it in $items) {
  $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $s.SelectVoice($it.voice)
  $s.Rate = [int]$it.rate
  $s.SetOutputToWaveFile((Join-Path $OutDir ($it.id + ".wav")), $fmt)
  $s.Speak($it.text)
  $s.Dispose()
}
