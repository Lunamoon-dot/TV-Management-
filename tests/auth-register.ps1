param([string]$BaseUrl = 'http://localhost:5006', [string]$SqlServer = '.\MSSQLSERVER01', [string]$Database = 'NothingDb')

$ErrorActionPreference = 'Stop'
# Run only against a local lesson API using the specified SQL database.
$suffix = [guid]::NewGuid().ToString('N')
$email = "lesson16-$suffix@example.test"
$weakEmail = "lesson16-weak-$suffix@example.test"
$password = 'Local-Test-' + [guid]::NewGuid().ToString('N') + '!aA1'
$session = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
$csrf = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $session).token
function Read-Body($response) {
    $body = if ($response.Content -is [byte[]]) { [Text.Encoding]::UTF8.GetString($response.Content) } else { $response.Content }
    return $body | ConvertFrom-Json
}
function Register($payload) {
    Invoke-WebRequest "$BaseUrl/api/auth/register" -WebSession $session -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Method Post -ContentType 'application/json' -Body ($payload | ConvertTo-Json) -SkipHttpErrorCheck
}
function Run-Sql([string]$query) {
    $result = & sqlcmd -S $SqlServer -d $Database -E -C -I -b -Q $query
    if ($LASTEXITCODE -ne 0) { throw "SQL assertion failed: $($result -join ' ')" }
    $result
}

try {
    $invalid = Register @{ email='invalid'; password='short' }
    $invalidBody = Read-Body $invalid
    if ($invalid.StatusCode -ne 400 -or -not $invalidBody.errors.Email -or -not $invalidBody.errors.Password) { throw 'DTO validation failed.' }
    $weak = Register @{ email=$weakEmail; password='abcdefghijklmnop' }
    if ($weak.StatusCode -ne 400 -or -not (Read-Body $weak).errors.Password) { throw 'Identity password validation failed.' }
    $large = Register @{ email=$weakEmail; password=('A' * 129) }
    if ($large.StatusCode -ne 400) { throw 'Oversized password was accepted.' }
    $response = Register @{ email=$email; password=$password; role='Admin'; emailConfirmed=$true }
    $body = Read-Body $response
    if ($response.StatusCode -ne 201 -or -not $body.id -or $body.email -ne $email) { throw 'Registration failed.' }
    if (@($body.PSObject.Properties.Name | Where-Object { $_ -notin @('id', 'email') }).Count -gt 0 -or $response.Headers['Set-Cookie']) { throw 'Registration leaked fields or issued a cookie.' }
    $duplicate = Register @{ email=$email.ToUpperInvariant(); password=$password }
    if ($duplicate.StatusCode -ne 400 -or -not (Read-Body $duplicate).errors.Email) { throw 'Duplicate registration accepted.' }
    Run-Sql @"
SET NOCOUNT ON;
IF (SELECT COUNT(*) FROM AspNetUsers WHERE Email = '$email') <> 1 THROW 51000, 'Expected one account', 1;
IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE Email = '$email' AND LEN(PasswordHash) > 60 AND EmailConfirmed = 0 AND NormalizedEmail = UPPER('$email') AND NormalizedUserName = UPPER('$email')) THROW 51000, 'Account storage incorrect', 1;
IF EXISTS (SELECT 1 FROM AspNetUsers WHERE Email = '$weakEmail') THROW 51000, 'Invalid registration persisted', 1;
IF EXISTS (SELECT 1 FROM AspNetUserRoles r JOIN AspNetUsers u ON u.Id = r.UserId WHERE u.Email = '$email') THROW 51000, 'Client assigned a role', 1;
"@ | Out-Null
    Write-Output 'PASS: DTO400; Identity400; password length; registration201; duplicate400; safe response/no cookie; hashed storage; unconfirmed/no roles'
} finally {
    # Delete only the two generated test emails, never an existing user/account.
    Run-Sql "DELETE FROM AspNetUsers WHERE Email IN ('$email', '$weakEmail');" | Out-Null
}
