$ErrorActionPreference = 'Continue'
Set-Location 'D:\DEV\Gyorsanhazat'
$bytes = [System.IO.File]::ReadAllBytes('D:\DEV\Gyorsanhazat\_teszt.png')
$b64 = [Convert]::ToBase64String($bytes)
$k = (netlify env:get BREVO_API_KEY --context production 2>&1 | Out-String).Trim()
$h = @{ 'api-key' = $k; 'Content-Type' = 'application/json'; accept = 'application/json' }

Write-Output ('PNG: ' + $bytes.Length + ' bajt, base64: ' + $b64.Length)

# --- A: kozvetlenul a Brevonak, ugyanazzal a mezokkel, mint a function ---
$a = @{
  sender      = @{ email = 'no-reply@gyors-haz.hu'; name = 'Gyors Haz' }
  to          = @(@{ email = 'okroslaszlo@gmail.com' })
  replyTo     = @{ email = 'info@instantotthonok.com'; name = 'Gyors Haz' }
  subject     = 'TESZT A - kozvetlen Brevo'
  htmlContent = '<p>TESZT A: kozvetlenul a Brevo APInak kuldve.</p>'
  textContent = 'TESZT A'
  attachment  = @(@{ name = 'alaprajz.png'; content = $b64 })
  tags        = @('diag')
} | ConvertTo-Json -Depth 6
try { $r = Invoke-WebRequest -Uri 'https://api.brevo.com/v3/smtp/email' -Headers $h -Method POST -Body ([Text.Encoding]::UTF8.GetBytes($a)) -UseBasicParsing -TimeoutSec 60
  Write-Output ('A (kozvetlen)  : HTTP ' + $r.StatusCode + ' ' + $r.Content) } catch { Write-Output ('A HIBA: ' + $_.Exception.Message) }

# --- B: kozvetlenul, DE tags nelkul es csak htmlContent ---
$bb = @{
  sender      = @{ email = 'no-reply@gyors-haz.hu'; name = 'Gyors Haz' }
  to          = @(@{ email = 'okroslaszlo@gmail.com' })
  subject     = 'TESZT B - kozvetlen, minimalis'
  htmlContent = '<p>TESZT B: minimalis mezokkel.</p>'
  attachment  = @(@{ name = 'terv.png'; content = $b64 })
} | ConvertTo-Json -Depth 6
try { $r = Invoke-WebRequest -Uri 'https://api.brevo.com/v3/smtp/email' -Headers $h -Method POST -Body ([Text.Encoding]::UTF8.GetBytes($bb)) -UseBasicParsing -TimeoutSec 60
  Write-Output ('B (minimalis)  : HTTP ' + $r.StatusCode + ' ' + $r.Content) } catch { Write-Output ('B HIBA: ' + $_.Exception.Message) }

# --- C: az eles Netlify functionon keresztul ---
$c = @{ email='okroslaszlo@gmail.com'; name='TESZT C'; image=('data:image/png;base64,' + $b64); rooms='Nappali 27 m2'; sendToUs=$false } | ConvertTo-Json
try { $r = Invoke-WebRequest -Uri 'https://gyors-haz.hu/.netlify/functions/send-plan' -Method POST -Body ([Text.Encoding]::UTF8.GetBytes($c)) -ContentType 'application/json' -UseBasicParsing -TimeoutSec 60
  Write-Output ('C (function)   : HTTP ' + $r.StatusCode + ' ' + $r.Content) } catch {
  $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
  Write-Output ('C (function)   : HTTP ' + [int]$_.Exception.Response.StatusCode + ' ' + $sr.ReadToEnd()) }
