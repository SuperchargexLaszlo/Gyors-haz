$ErrorActionPreference = 'Continue'
Set-Location 'D:\DEV\Gyorsanhazat'
$k = (netlify env:get BREVO_API_KEY --context production 2>&1 | Out-String).Trim()
$h = @{ 'api-key' = $k; accept = 'application/json' }

Write-Output '=== UTOLSO TRANZAKCIOS LEVELEK ==='
try {
  $r = Invoke-RestMethod -Uri 'https://api.brevo.com/v3/smtp/emails?limit=8&sort=desc' -Headers $h -Method GET -TimeoutSec 40
  foreach ($e in $r.transactionalEmails) {
    Write-Output ('  ' + $e.date + '  ->' + $e.email)
    Write-Output ('      targy: ' + $e.subject)
    Write-Output ('      uuid : ' + $e.uuid)
  }
} catch {
  Write-Output ('  HIBA: ' + $_.Exception.Message)
  if ($_.Exception.Response) { $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); Write-Output ('  ' + $sr.ReadToEnd()) }
}

Write-Output ''
Write-Output '=== FIOK ES KORLATOK ==='
try {
  $a = Invoke-RestMethod -Uri 'https://api.brevo.com/v3/account' -Headers $h -Method GET -TimeoutSec 30
  Write-Output ('  ' + $a.email)
  $a.plan | ForEach-Object { Write-Output ('  csomag: ' + $_.type + '  credits: ' + $_.credits + '  ' + $_.creditsType) }
} catch { Write-Output ('  HIBA: ' + $_.Exception.Message) }
