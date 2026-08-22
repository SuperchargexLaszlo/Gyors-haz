$ErrorActionPreference = 'Continue'
Set-Location 'D:\DEV\Gyorsanhazat'

$bytes = [System.IO.File]::ReadAllBytes('D:\DEV\Gyorsanhazat\_teszt.png')
$b64 = [Convert]::ToBase64String($bytes)
Write-Output ('PNG merete    : ' + $bytes.Length + ' bajt')
Write-Output ('base64 hossz  : ' + $b64.Length)

$k = (netlify env:get BREVO_API_KEY --context production 2>&1 | Out-String).Trim()
$h = @{ 'api-key' = $k; 'Content-Type' = 'application/json'; accept = 'application/json' }

Write-Output ''
Write-Output '=== 1. KOZVETLEN BREVO HIVAS a valodi PNG-vel ==='
$body = @{
  sender      = @{ email = 'no-reply@gyors-haz.hu'; name = 'Gyors Haz' }
  to          = @(@{ email = 'okroslaszlo@gmail.com' })
  subject     = 'DIAG 1 - kozvetlen Brevo hivas, valodi alaprajz'
  htmlContent = '<p>Diagnosztika: ehhez a levelhez egy 102 kB-os PNG-nek kell tartoznia.</p>'
  attachment  = @(@{ name = 'alaprajz.png'; content = $b64 })
} | ConvertTo-Json -Depth 6

Write-Output ('  JSON merete : ' + $body.Length + ' karakter')
try {
  $r = Invoke-WebRequest -Uri 'https://api.brevo.com/v3/smtp/email' -Headers $h -Method POST -Body $body -UseBasicParsing -TimeoutSec 60
  Write-Output ('  HTTP ' + $r.StatusCode + '  ' + $r.Content)
} catch {
  Write-Output ('  HIBA: ' + $_.Exception.Message)
  if ($_.Exception.Response) { $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); Write-Output ('  ' + $sr.ReadToEnd()) }
}

Write-Output ''
Write-Output '=== 2. UGYANEZ, DE UTF8 BYTE-KENT KULDVE ==='
try {
  $enc = [System.Text.Encoding]::UTF8.GetBytes($body)
  $r2 = Invoke-WebRequest -Uri 'https://api.brevo.com/v3/smtp/email' -Headers $h -Method POST -Body $enc -UseBasicParsing -TimeoutSec 60
  Write-Output ('  HTTP ' + $r2.StatusCode + '  ' + $r2.Content)
} catch {
  Write-Output ('  HIBA: ' + $_.Exception.Message)
}
