$r = Invoke-WebRequest -Uri 'https://gyors-haz.hu/alaprajz-tervezo.js' -UseBasicParsing -Method Head -TimeoutSec 30
Write-Output '=== a tervezo JS fejlecei ==='
foreach ($n in @('cache-control','etag','last-modified','content-length','age')) {
  if ($r.Headers[$n]) { Write-Output ('  ' + $n + ': ' + $r.Headers[$n]) }
}
Write-Output ''
Write-Output '=== tartalmazza-e az uj kodot ==='
$c = (Invoke-WebRequest -Uri 'https://gyors-haz.hu/alaprajz-tervezo.js' -UseBasicParsing -TimeoutSec 30).Content
Write-Output ('  isUnheated : ' + $(if ($c -like '*isUnheated*') {'igen'} else {'NEM'}))
Write-Output ('  sendToUs   : ' + $(if ($c -like '*sendToUs*') {'igen'} else {'NEM'}))
Write-Output ('  meret      : ' + $c.Length)
