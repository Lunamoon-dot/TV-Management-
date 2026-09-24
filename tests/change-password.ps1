param([string]$BaseUrl = 'http://localhost:5005', [string]$SqlServer = '.\MSSQLSERVER01', [string]$Database = 'NothingDb')
$ErrorActionPreference = 'Stop'
$suffix = [guid]::NewGuid().ToString('N')
$email = "password-$suffix@example.test"
$oldPassword = 'localtest123'
$newPassword = 'newlocal456'
$session = [Microsoft.PowerShell.Commands.WebRequestSession]::new()

function Expect($response, [int]$code, [string]$label) {
    if ($response.StatusCode -ne $code) { throw "${label}: expected $code, got $($response.StatusCode)" }
    Write-Output "PASS: $label ($code)"
}

function Csrf($webSession) {
    (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $webSession).token
}

try {
    $csrf = Csrf $session
    $registerBody = @{ email=$email; password=$oldPassword } | ConvertTo-Json
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/register" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body $registerBody -SkipHttpErrorCheck) 201 'register test account'

    $loginBody = @{ email=$email; password=$oldPassword } | ConvertTo-Json
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/login" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body $loginBody -SkipHttpErrorCheck) 204 'login with original password'

    $validBody = @{ currentPassword=$oldPassword; newPassword=$newPassword } | ConvertTo-Json
    Expect (Invoke-WebRequest "$BaseUrl/api/account/password" -WebSession $session -Method Put -ContentType 'application/json' -Body $validBody -SkipHttpErrorCheck) 400 'change password requires CSRF'

    $csrf = Csrf $session
    $wrongBody = @{ currentPassword='incorrect123'; newPassword=$newPassword } | ConvertTo-Json
    Expect (Invoke-WebRequest "$BaseUrl/api/account/password" -WebSession $session -Method Put -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body $wrongBody -SkipHttpErrorCheck) 400 'wrong current password is rejected'

    $weakBody = @{ currentPassword=$oldPassword; newPassword='abcdefgh' } | ConvertTo-Json
    Expect (Invoke-WebRequest "$BaseUrl/api/account/password" -WebSession $session -Method Put -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body $weakBody -SkipHttpErrorCheck) 400 'password policy is enforced'

    Expect (Invoke-WebRequest "$BaseUrl/api/account/password" -WebSession $session -Method Put -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body $validBody -SkipHttpErrorCheck) 204 'change password'
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/me" -WebSession $session -SkipHttpErrorCheck) 200 'current cookie remains valid after refresh'

    $oldSession = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
    $oldCsrf = Csrf $oldSession
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/login" -WebSession $oldSession -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$oldCsrf } -Body $loginBody -SkipHttpErrorCheck) 401 'old password no longer works'

    $newSession = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
    $newCsrf = Csrf $newSession
    $newLoginBody = @{ email=$email; password=$newPassword } | ConvertTo-Json
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/login" -WebSession $newSession -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$newCsrf } -Body $newLoginBody -SkipHttpErrorCheck) 204 'new password works'
} finally {
    & sqlcmd -S $SqlServer -d $Database -E -C -I -b -Q "DELETE FROM AspNetUsers WHERE Email='$email';" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Change password test cleanup failed.' }
}

