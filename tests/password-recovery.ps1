param(
    [string]$BaseUrl = 'http://localhost:5005',
    [string]$PickupDirectory = '.\.dev-emails',
    [string]$SqlServer = '.\MSSQLSERVER01',
    [string]$Database = 'NothingDb'
)
$ErrorActionPreference = 'Stop'
$suffix = [guid]::NewGuid().ToString('N')
$email = "recovery-$suffix@example.test"
$missingEmail = "missing-$suffix@example.test"
$oldPassword = 'localtest123'
$newPassword = 'recovered456'
$session = [Microsoft.PowerShell.Commands.WebRequestSession]::new()

function Expect($response, [int]$code, [string]$label) {
    if ($response.StatusCode -ne $code) { throw "${label}: expected $code, got $($response.StatusCode)" }
    Write-Output "PASS: $label ($code)"
}

function Csrf($webSession) {
    (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $webSession).token
}

try {
    New-Item -ItemType Directory -Force -Path $PickupDirectory | Out-Null
    Get-ChildItem -LiteralPath $PickupDirectory -Filter 'password-reset-*.json' | Remove-Item -Force

    $csrf = Csrf $session
    $registerBody = @{ email=$email; password=$oldPassword } | ConvertTo-Json
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/register" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body $registerBody -SkipHttpErrorCheck) 201 'register recovery account'

    $forgotBody = @{ email=$email } | ConvertTo-Json
    $noCsrfSession = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/forgot-password" -WebSession $noCsrfSession -Method Post -ContentType 'application/json' -Body $forgotBody -SkipHttpErrorCheck) 400 'forgot password requires CSRF'

    $missingBody = @{ email=$missingEmail } | ConvertTo-Json
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/forgot-password" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body $missingBody -SkipHttpErrorCheck) 204 'unknown email gets generic response'
    if (Get-ChildItem -LiteralPath $PickupDirectory -Filter 'password-reset-*.json') {
        throw 'Unknown email unexpectedly created a reset message.'
    }

    Expect (Invoke-WebRequest "$BaseUrl/api/auth/forgot-password" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body $forgotBody -SkipHttpErrorCheck) 204 'known email gets same generic response'
    $messageFile = Get-ChildItem -LiteralPath $PickupDirectory -Filter 'password-reset-*.json' | Select-Object -First 1
    if ($null -eq $messageFile) { throw 'Development reset message was not created.' }
    $message = Get-Content -LiteralPath $messageFile.FullName -Raw | ConvertFrom-Json
    if ($message.Email -ne $email -or [string]::IsNullOrWhiteSpace($message.ResetCode)) {
        throw 'Development reset message is invalid.'
    }
    Write-Output 'PASS: development delivery contains the reset code'

    $invalidReset = @{ email=$email; resetCode='invalid-code'; newPassword=$newPassword } | ConvertTo-Json
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/reset-password" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body $invalidReset -SkipHttpErrorCheck) 400 'invalid reset code is rejected'

    $validReset = @{ email=$email; resetCode=$message.ResetCode; newPassword=$newPassword } | ConvertTo-Json
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/reset-password" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body $validReset -SkipHttpErrorCheck) 204 'reset password with delivered code'

    $oldSession = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
    $oldCsrf = Csrf $oldSession
    $oldLogin = @{ email=$email; password=$oldPassword } | ConvertTo-Json
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/login" -WebSession $oldSession -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$oldCsrf } -Body $oldLogin -SkipHttpErrorCheck) 401 'old password no longer works'

    $newSession = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
    $newCsrf = Csrf $newSession
    $newLogin = @{ email=$email; password=$newPassword } | ConvertTo-Json
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/login" -WebSession $newSession -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$newCsrf } -Body $newLogin -SkipHttpErrorCheck) 204 'recovered password works'
} finally {
    & sqlcmd -S $SqlServer -d $Database -E -C -I -b -Q "DELETE FROM AspNetUsers WHERE Email='$email';" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Password recovery test cleanup failed.' }
    if (Test-Path -LiteralPath $PickupDirectory) {
        Get-ChildItem -LiteralPath $PickupDirectory -Filter 'password-reset-*.json' | Remove-Item -Force
    }
}
