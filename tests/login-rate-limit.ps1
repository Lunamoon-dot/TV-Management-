param([string]$BaseUrl = 'http://localhost:5006')
$ErrorActionPreference = 'Stop'
$session = [Microsoft.PowerShell.Commands.WebRequestSession]::new()

function Login([string]$token) {
    Invoke-WebRequest "$BaseUrl/api/auth/login" `
        -WebSession $session `
        -Method Post `
        -ContentType 'application/json' `
        -Headers @{ 'X-CSRF-TOKEN' = $token } `
        -Body (@{ email='missing@example.test'; password='WrongPassword1' } | ConvertTo-Json) `
        -SkipHttpErrorCheck
}

$csrf = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $session).token
for ($attempt = 1; $attempt -le 10; $attempt++) {
    $response = Login $csrf
    if ($response.StatusCode -ne 401) {
        throw "Attempt ${attempt}: expected 401, got $($response.StatusCode)"
    }
}
Write-Output 'PASS: first 10 login attempts reach the endpoint (401)'

$blocked = Login $csrf
if ($blocked.StatusCode -ne 429) {
    throw "Attempt 11: expected 429, got $($blocked.StatusCode)"
}
if (-not $blocked.Headers['Retry-After']) {
    throw 'Rate-limited response is missing Retry-After'
}
$problem = $blocked.Content | ConvertFrom-Json
if ($problem.status -ne 429 -or -not $problem.title) {
    throw 'Rate-limited response is not the expected ProblemDetails payload'
}
Write-Output 'PASS: attempt 11 returns 429 ProblemDetails with Retry-After'
