param([string]$BaseUrl = 'http://localhost:5005', [string]$SqlServer = '.\MSSQLSERVER01', [string]$Database = 'NothingDb')
$ErrorActionPreference = 'Stop'
$suffix = [guid]::NewGuid().ToString('N')
$email = "catalog-admin-$suffix@example.test"
$password = 'localtest123'
$session = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
$productId = 0

function Expect($response, [int]$code, [string]$label) {
    if ($response.StatusCode -ne $code) { throw "${label}: expected $code, got $($response.StatusCode)" }
    Write-Output "PASS: $label ($code)"
}

try {
    $csrf = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $session).token
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/register" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body (@{ email=$email; password=$password } | ConvertTo-Json) -SkipHttpErrorCheck) 201 'register catalog admin'
    & sqlcmd -S $SqlServer -d $Database -E -C -I -b -Q "INSERT INTO AspNetUserRoles (UserId, RoleId) SELECT u.Id, r.Id FROM AspNetUsers u CROSS JOIN AspNetRoles r WHERE u.Email='$email' AND r.Name='Admin';" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Could not assign Admin role.' }
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/login" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body (@{ email=$email; password=$password } | ConvertTo-Json) -SkipHttpErrorCheck) 204 'login catalog admin'
    $csrf = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $session).token
    $brandId = (Invoke-RestMethod "$BaseUrl/api/brands")[0].id

    $invalid = @{ name='Test TV'; imageUrl='not-a-url'; screenSizeInches=0; resolution=' '; brandId=$brandId; price=1000000; stock=1 } | ConvertTo-Json
    Expect (Invoke-WebRequest "$BaseUrl/api/products" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body $invalid -SkipHttpErrorCheck) 400 'reject invalid catalog details'

    $valid = @{ name='Catalog details test'; imageUrl='https://example.com/tv.jpg'; screenSizeInches=55.5; resolution='4K UHD'; brandId=$brandId; price=1000000; stock=1 } | ConvertTo-Json
    $created = Invoke-RestMethod "$BaseUrl/api/products" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body $valid
    $productId = $created.id
    if ($created.imageUrl -ne 'https://example.com/tv.jpg' -or $created.screenSizeInches -ne 55.5 -or $created.resolution -ne '4K UHD') { throw 'Created response has incorrect catalog details.' }
    Write-Output 'PASS: create and return catalog details'

    $stored = Invoke-RestMethod "$BaseUrl/api/products/$productId"
    if ($stored.imageUrl -ne $created.imageUrl -or $stored.screenSizeInches -ne 55.5) { throw 'Stored catalog details are incorrect.' }
    Write-Output 'PASS: read catalog details from SQL'
} finally {
    $cleanup = "IF $productId > 0 DELETE FROM Products WHERE Id=$productId; DELETE FROM AspNetUsers WHERE Email='$email';"
    & sqlcmd -S $SqlServer -d $Database -E -C -I -b -Q $cleanup | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Test cleanup failed.' }
}
