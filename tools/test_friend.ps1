$base = 'http://127.0.0.1:8000/api'
Write-Output "Registering user A..."
try{
  $r1 = Invoke-RestMethod -Uri "$base/register" -Method Post -Body (ConvertTo-Json @{name='clientTestA';email='clientA@example.com';password='password'}) -ContentType 'application/json' -ErrorAction Stop
  Write-Output "A: " + ($r1 | ConvertTo-Json -Depth 5)
}catch{
  Write-Output "A register error: $($_.Exception.Message)"
  if ($_.Exception.Response) { Write-Output $_.Exception.Response.Content.ReadAsStringAsync().Result }
}

Write-Output "Registering user B..."
try{
  $r2 = Invoke-RestMethod -Uri "$base/register" -Method Post -Body (ConvertTo-Json @{name='clientTestB';email='clientB@example.com';password='password'}) -ContentType 'application/json' -ErrorAction Stop
  Write-Output "B: " + ($r2 | ConvertTo-Json -Depth 5)
}catch{
  Write-Output "B register error: $($_.Exception.Message)"
  if ($_.Exception.Response) { Write-Output $_.Exception.Response.Content.ReadAsStringAsync().Result }
}

if (-not $r1 -or -not $r2) { Write-Output "Missing responses; aborting."; exit 1 }
$token = $r1.token
$idB = $r2.user.id
Write-Output "TokenA: $token; idB: $idB"

Write-Output "Sending friend request from A to B..."
try{
  $hdr = @{ Authorization = "Bearer $token" }
  $req = Invoke-RestMethod -Uri "$base/friends/request" -Method Post -Body (ConvertTo-Json @{recipient_id=$idB}) -ContentType 'application/json' -Headers $hdr -ErrorAction Stop
  Write-Output "Request success: " + ($req | ConvertTo-Json -Depth 5)
}catch{
  Write-Output "Request error: $($_.Exception.Message)"
  if ($_.Exception.Response) { Write-Output $_.Exception.Response.Content.ReadAsStringAsync().Result }
}

Write-Output "Done"
