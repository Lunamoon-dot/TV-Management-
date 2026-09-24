param([string]$BaseUrl = 'http://localhost:5005', [string]$SqlServer = '.\MSSQLSERVER01', [string]$Database = 'NothingDb')
$ErrorActionPreference = 'Stop'
$suffix = [guid]::NewGuid().ToString('N')
$email1 = "profile-owner-$suffix@example.test"
$email2 = "profile-other-$suffix@example.test"
$password = 'localtest123'
$owner = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
$other = [Microsoft.PowerShell.Commands.WebRequestSession]::new()

function Expect($response, [int]$code, [string]$label) {
    if ($response.StatusCode -ne $code) { throw "${label}: expected $code, got $($response.StatusCode)" }
    Write-Output "PASS: $label ($code)"
}

function Register-And-Login($session, [string]$email) {
    $csrf = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $session).token
    $register = Invoke-WebRequest "$BaseUrl/api/auth/register" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body (@{ email=$email; password=$password } | ConvertTo-Json) -SkipHttpErrorCheck
    Expect $register 201 "register $email"
    $login = Invoke-WebRequest "$BaseUrl/api/auth/login" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body (@{ email=$email; password=$password } | ConvertTo-Json) -SkipHttpErrorCheck
    Expect $login 204 "login $email"
}

try {
    Expect (Invoke-WebRequest "$BaseUrl/api/account/profile" -SkipHttpErrorCheck) 401 'anonymous profile'
    Register-And-Login $owner $email1
    Register-And-Login $other $email2

    $initial = Invoke-RestMethod "$BaseUrl/api/account/profile" -WebSession $owner
    if ($initial.email -ne $email1 -or $null -ne $initial.fullName -or $null -ne $initial.shippingAddress) {
        throw 'New account profile has unexpected values.'
    }
    Write-Output 'PASS: new profile belongs to current cookie user'

    $validBody = @{
        fullName='  Nguyen Van Huy  '
        phoneNumber='  0901234567  '
        shippingAddress='  123 Duong Test, Quan 1  '
    } | ConvertTo-Json
    Expect (Invoke-WebRequest "$BaseUrl/api/account/profile" -WebSession $owner -Method Put -ContentType 'application/json' -Body $validBody -SkipHttpErrorCheck) 400 'profile update requires CSRF'

    $csrf = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $owner).token
    $invalidBody = @{ fullName='A'; phoneNumber='abc'; shippingAddress='short' } | ConvertTo-Json
    Expect (Invoke-WebRequest "$BaseUrl/api/account/profile" -WebSession $owner -Method Put -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body $invalidBody -SkipHttpErrorCheck) 400 'invalid profile is rejected'

    $updatedResponse = Invoke-WebRequest "$BaseUrl/api/account/profile" -WebSession $owner -Method Put -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body $validBody -SkipHttpErrorCheck
    Expect $updatedResponse 200 'update own profile'
    $updated = $updatedResponse.Content | ConvertFrom-Json
    if ($updated.fullName -ne 'Nguyen Van Huy' -or $updated.phoneNumber -ne '0901234567' -or $updated.shippingAddress -ne '123 Duong Test, Quan 1') {
        throw 'Updated profile was not trimmed or returned correctly.'
    }
    Write-Output 'PASS: updated profile is normalized and returned'

    $otherProfile = Invoke-RestMethod "$BaseUrl/api/account/profile" -WebSession $other
    if ($otherProfile.email -ne $email2 -or $null -ne $otherProfile.fullName -or $null -ne $otherProfile.shippingAddress) {
        throw 'Another user can see the owner profile data.'
    }
    Write-Output 'PASS: profile data is isolated by authenticated user'

    $stored = & sqlcmd -S $SqlServer -d $Database -E -C -W -h -1 -Q "SET NOCOUNT ON; SELECT CONCAT(FullName, '|', PhoneNumber, '|', ShippingAddress) FROM AspNetUsers WHERE Email='$email1';"
    if (($stored | Where-Object { $_.Trim() }) -notcontains 'Nguyen Van Huy|0901234567|123 Duong Test, Quan 1') {
        throw 'Profile values were not persisted in SQL Server.'
    }
    Write-Output 'PASS: profile persisted in SQL Server'
} finally {
    & sqlcmd -S $SqlServer -d $Database -E -C -I -b -Q "DELETE FROM AspNetUsers WHERE Email IN ('$email1', '$email2');" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Profile test cleanup failed.' }
}
