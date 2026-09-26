param(
    [string]$BaseUrl = 'http://localhost:5005',
    [string]$PickupDirectory = '.\.dev-emails',
    [string]$SqlServer = '.\MSSQLSERVER01',
    [string]$Database = 'NothingDb'
)
$ErrorActionPreference = 'Stop'
$suffix = [guid]::NewGuid().ToString('N')
$email = "confirmation-$suffix@example.test"
$missingEmail = "missing-$suffix@example.test"
$password = 'localtest123'
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
    Get-ChildItem -LiteralPath $PickupDirectory -Filter 'email-confirmation-*.json' | Remove-Item -Force

    $csrf = Csrf $session
    $registerBody = @{ email=$email; password=$password } | ConvertTo-Json
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/register" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body $registerBody -SkipHttpErrorCheck) 201 'register account'

    $messageFile = Get-ChildItem -LiteralPath $PickupDirectory -Filter 'email-confirmation-*.json' | Select-Object -First 1
    if ($null -eq $messageFile) { throw 'Registration did not create a confirmation message.' }
    $message = Get-Content -LiteralPath $messageFile.FullName -Raw | ConvertFrom-Json
    if ($message.Email -ne $email -or [string]::IsNullOrWhiteSpace($message.ConfirmationCode) -or $message.ConfirmationPath -notlike '/confirm-email?*') {
        throw 'Development confirmation message is invalid.'
    }
    Write-Output 'PASS: registration creates a confirmation path'

    $confirmed = & sqlcmd -S $SqlServer -d $Database -E -C -W -h -1 -Q "SET NOCOUNT ON; SELECT CAST(EmailConfirmed AS int) FROM AspNetUsers WHERE Email='$email';"
    if (($confirmed | Where-Object { $_.Trim() }) -notcontains '0') { throw 'New account is unexpectedly confirmed.' }
    Write-Output 'PASS: new account starts unconfirmed'

    $noCsrfSession = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
    $sendBody = @{ email=$email } | ConvertTo-Json
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/send-confirmation-email" -WebSession $noCsrfSession -Method Post -ContentType 'application/json' -Body $sendBody -SkipHttpErrorCheck) 400 'resend requires CSRF'

    $missingBody = @{ email=$missingEmail } | ConvertTo-Json
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/send-confirmation-email" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body $missingBody -SkipHttpErrorCheck) 204 'unknown email gets generic response'

    $filesBeforeResend = @(Get-ChildItem -LiteralPath $PickupDirectory -Filter 'email-confirmation-*.json').Count
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/send-confirmation-email" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body $sendBody -SkipHttpErrorCheck) 204 'known email gets same generic response'
    $filesAfterResend = @(Get-ChildItem -LiteralPath $PickupDirectory -Filter 'email-confirmation-*.json').Count
    if ($filesAfterResend -ne $filesBeforeResend + 1) { throw 'Resend did not create exactly one message.' }
    Write-Output 'PASS: resend creates a new confirmation message only for known account'

    $invalidBody = @{ email=$email; confirmationCode='invalid-code' } | ConvertTo-Json
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/confirm-email" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body $invalidBody -SkipHttpErrorCheck) 400 'invalid confirmation code is rejected'

    $validBody = @{ email=$email; confirmationCode=$message.ConfirmationCode } | ConvertTo-Json
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/confirm-email" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body $validBody -SkipHttpErrorCheck) 204 'confirm email'

    $confirmed = & sqlcmd -S $SqlServer -d $Database -E -C -W -h -1 -Q "SET NOCOUNT ON; SELECT CAST(EmailConfirmed AS int) FROM AspNetUsers WHERE Email='$email';"
    if (($confirmed | Where-Object { $_.Trim() }) -notcontains '1') { throw 'EmailConfirmed was not persisted.' }
    Write-Output 'PASS: confirmation persisted in SQL Server'

    $loginBody = @{ email=$email; password=$password } | ConvertTo-Json
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/login" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body $loginBody -SkipHttpErrorCheck) 204 'confirmed account can log in'
} finally {
    & sqlcmd -S $SqlServer -d $Database -E -C -I -b -Q "DELETE FROM AspNetUsers WHERE Email='$email';" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Email confirmation test cleanup failed.' }
    if (Test-Path -LiteralPath $PickupDirectory) {
        Get-ChildItem -LiteralPath $PickupDirectory -Filter 'email-confirmation-*.json' | Remove-Item -Force
    }
}

