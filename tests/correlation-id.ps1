param([string]$BaseUrl = 'http://localhost:5006')
$ErrorActionPreference = 'Stop'

$first = Invoke-WebRequest "$BaseUrl/health/live"
$firstId = $first.Headers['X-Correlation-ID']
if ($first.StatusCode -ne 200 -or [string]::IsNullOrWhiteSpace($firstId)) {
    throw 'Response does not contain a generated correlation ID.'
}
Write-Output "PASS: server generated correlation ID $firstId"

$second = Invoke-WebRequest "$BaseUrl/health/live"
if ($second.Headers['X-Correlation-ID'] -eq $firstId) {
    throw 'Two requests received the same generated correlation ID.'
}
Write-Output 'PASS: separate requests receive separate IDs'

$clientId = 'frontend-checkout-123'
$echoed = Invoke-WebRequest "$BaseUrl/health/live" -Headers @{ 'X-Correlation-ID' = $clientId }
if ($echoed.Headers['X-Correlation-ID'] -ne $clientId) {
    throw 'A valid client correlation ID was not preserved.'
}
Write-Output 'PASS: safe client correlation ID is preserved'

$invalidId = 'x' * 65
$replaced = Invoke-WebRequest "$BaseUrl/health/live" -Headers @{ 'X-Correlation-ID' = $invalidId }
if ($replaced.Headers['X-Correlation-ID'] -eq $invalidId) {
    throw 'An invalid client correlation ID was accepted.'
}
Write-Output 'PASS: invalid client correlation ID is replaced'
