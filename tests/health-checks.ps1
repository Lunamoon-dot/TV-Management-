param([string]$BaseUrl = 'http://localhost:5005')
$ErrorActionPreference = 'Stop'

$live = Invoke-WebRequest "$BaseUrl/health/live" -SkipHttpErrorCheck
if ($live.StatusCode -ne 200 -or $live.Content -ne 'Healthy') {
    throw "Liveness check failed: HTTP $($live.StatusCode), body $($live.Content)"
}
Write-Output 'PASS: liveness does not depend on SQL Server'

$ready = Invoke-WebRequest "$BaseUrl/health/ready" -SkipHttpErrorCheck
if ($ready.StatusCode -ne 200 -or $ready.Content -ne 'Healthy') {
    throw "Readiness check failed: HTTP $($ready.StatusCode), body $($ready.Content)"
}
Write-Output 'PASS: readiness confirms SQL Server connection'
