$ErrorActionPreference = 'Continue'

function Deploy($root, $branch, $msg) {
  Set-Location $root
  Expand-Archive -Path (Join-Path $root '_fix.zip') -DestinationPath (Join-Path $root '_z') -Force
  Copy-Item (Join-Path $root '_z\p\*') -Destination $root -Recurse -Force
  Remove-Item (Join-Path $root '_z') -Recurse -Force
  Remove-Item (Join-Path $root '_fix.zip') -Force

  Write-Output ('--- ' + (Split-Path $root -Leaf) + ' ---')
  npm run build 2>&1 | Select-String -Pattern 'page\(s\) built|error' | Select-Object -Last 1
  netlify deploy --prod --dir dist --functions netlify/functions --message $msg 2>&1 |
    Select-String -Pattern 'Unique deploy|Website URL' | Select-Object -Last 1
  git add -A
  git commit -q -m $msg 2>&1 | Select-Object -Last 1
  git push -q origin $branch 2>&1 | Select-Object -Last 1
  git log --oneline -1
  Write-Output ''
}

$m = 'Ures csatolmany elleni vedelem: a rajz merete ellenorizve kuldes elott'
Deploy 'D:\DEV\Gyorsanhazat' 'master' $m
Deploy 'D:\DEV\Csaladihaz epites' 'main' $m
Deploy 'D:\DEV\Epitcentrum' 'main' $m

Write-Output '=== ELES ELLENORZES: apro kep elutasitasa ==='
$tiny = @{ email='teszt@pelda.hu'; image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' } | ConvertTo-Json
foreach ($u in @('https://gyors-haz.hu','https://csaladihaz-epites.hu','https://epitcentrum.hu')) {
  try {
    $r = Invoke-WebRequest -Uri ($u + '/.netlify/functions/send-plan') -Method POST -Body $tiny -ContentType 'application/json' -UseBasicParsing -TimeoutSec 40
    Write-Output ('  ' + $u.PadRight(32) + ' HTTP ' + $r.StatusCode + ' ' + $r.Content)
  } catch {
    $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Output ('  ' + $u.PadRight(32) + ' HTTP ' + [int]$_.Exception.Response.StatusCode + ' ' + $sr.ReadToEnd())
  }
}
