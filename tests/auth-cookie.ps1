param([string]$BaseUrl = 'http://localhost:5006', [string]$SqlServer = '.\MSSQLSERVER01', [string]$Database = 'NothingDb')
$ErrorActionPreference = 'Stop'
$email = 'lesson17-' + [guid]::NewGuid().ToString('N') + '@example.test'
$password = 'Local-Test-' + [guid]::NewGuid().ToString('N') + '!Aa1'
$session = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
function Expect($response, [int]$code, [string]$label) {
    if ($response.StatusCode -ne $code) { throw "${label}: expected $code, got $($response.StatusCode)" }
    Write-Output "PASS: $label ($code)"
}
function Send([string]$path, $body, [string]$token) {
    $session.Headers.Remove('X-CSRF-TOKEN')
    $headers = @{}
    if ($token) { $headers['X-CSRF-TOKEN'] = $token }
    Invoke-WebRequest "$BaseUrl/api/auth/$path" -WebSession $session -Method Post -ContentType 'application/json' -Body ($body | ConvertTo-Json) -Headers $headers -SkipHttpErrorCheck
}
try {
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/me" -WebSession $session -SkipHttpErrorCheck) 401 'anonymous me'
    Expect (Send 'register' @{ email=$email; password=$password } '') 400 'register requires CSRF'
    $csrf = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $session).token
    Expect (Send 'register' @{ email=$email; password=$password } $csrf) 201 'register'
    Expect (Send 'login' @{ email=$email; password=$password } '') 400 'login requires CSRF'
    Expect (Send 'login' @{ email=$email; password='WrongPassword-123!' } $csrf) 401 'wrong password'
    $login = Send 'login' @{ email=$email; password=$password } $csrf
    Expect $login 204 'login'
    $authCookie = $session.Cookies.GetCookies([uri]$BaseUrl) | Where-Object Name -eq 'TvStore.Auth'
    if (-not $authCookie -or -not $authCookie.HttpOnly) { throw 'Missing HttpOnly auth cookie' }
    if (($login.Headers['Set-Cookie'] -join ';') -notmatch '(?i)samesite=lax') { throw 'Missing SameSite=Lax' }
    $me = Invoke-RestMethod "$BaseUrl/api/auth/me" -WebSession $session
    if ($me.email -ne $email -or @($me.roles).Count -ne 0) { throw 'Unexpected current user' }
    Write-Output 'PASS: cookie identifies user; no assigned role'
    Expect (Send 'logout' @{} '') 400 'logout requires CSRF'
    Expect (Send 'logout' @{} $csrf) 400 'anonymous token invalid after login'
    $csrf = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $session).token
    Expect (Send 'logout' @{} $csrf) 204 'logout'
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/me" -WebSession $session -SkipHttpErrorCheck) 401 'me after logout'
    $csrf = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $session).token
    for ($i=0; $i -lt 5; $i++) {
        Expect (Send 'login' @{ email=$email; password='WrongPassword-123!' } $csrf) 401 'failed login'
    }
    Expect (Send 'login' @{ email=$email; password=$password } $csrf) 401 'locked account cannot sign in with correct password'
    Write-Output 'PASS: account lockout'
} finally {
    $result = & sqlcmd -S $SqlServer -d $Database -E -C -I -b -Q "DELETE FROM AspNetUsers WHERE Email = '$email';"
    if ($LASTEXITCODE -ne 0) { throw "Test cleanup failed: $($result -join ' ')" }
}
