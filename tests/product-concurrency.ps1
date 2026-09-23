param([string]$BaseUrl = 'http://localhost:5005', [string]$SqlServer = '.\MSSQLSERVER01', [string]$Database = 'NothingDb')
$ErrorActionPreference = 'Stop'
$suffix = [guid]::NewGuid().ToString('N')
$adminEmail = "product-concurrency-$suffix@example.test"
$password = 'localtest123'
$session = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
$productId = 0

function Expect($response, [int]$code, [string]$label) {
    if ($response.StatusCode -ne $code) { throw "${label}: expected $code, got $($response.StatusCode)" }
    Write-Output "PASS: $label ($code)"
}

try {
    $csrf = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $session).token
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/register" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body (@{ email=$adminEmail; password=$password } | ConvertTo-Json) -SkipHttpErrorCheck) 201 'register admin'
    & sqlcmd -S $SqlServer -d $Database -E -C -I -b -Q "INSERT INTO AspNetUserRoles (UserId, RoleId) SELECT u.Id, r.Id FROM AspNetUsers u CROSS JOIN AspNetRoles r WHERE u.Email='$adminEmail' AND r.Name='Admin';" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Could not assign Admin role.' }
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/login" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body (@{ email=$adminEmail; password=$password } | ConvertTo-Json) -SkipHttpErrorCheck) 204 'login admin'

    $brandId = (Invoke-RestMethod "$BaseUrl/api/brands")[0].id
    $csrf = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $session).token
    $createBody = @{ name='Concurrency TV'; imageUrl='https://example.com/concurrency-tv.jpg'; screenSizeInches=55; resolution='4K UHD'; brandId=$brandId; price=10000000; stock=5 }
    $created = Invoke-RestMethod "$BaseUrl/api/products" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body ($createBody | ConvertTo-Json)
    $productId = $created.id
    if ([string]::IsNullOrWhiteSpace($created.rowVersion)) { throw 'Create response did not return rowVersion.' }
    $staleVersion = $created.rowVersion

    $firstBody = $createBody.Clone()
    $firstBody.name = 'Concurrency TV first update'
    $firstBody.rowVersion = $staleVersion
    Expect (Invoke-WebRequest "$BaseUrl/api/products/$productId" -WebSession $session -Method Put -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body ($firstBody | ConvertTo-Json) -SkipHttpErrorCheck) 204 'first update with current rowVersion'

    $staleBody = $createBody.Clone()
    $staleBody.name = 'Concurrency TV stale update'
    $staleBody.rowVersion = $staleVersion
    Expect (Invoke-WebRequest "$BaseUrl/api/products/$productId" -WebSession $session -Method Put -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body ($staleBody | ConvertTo-Json) -SkipHttpErrorCheck) 409 'stale update is rejected'

    $current = Invoke-RestMethod "$BaseUrl/api/products/$productId"
    if ($current.name -ne 'Concurrency TV first update' -or $current.rowVersion -eq $staleVersion) { throw 'Stale update overwrote the product or rowVersion did not change.' }
    Write-Output 'PASS: first update is preserved and rowVersion advances'
} finally {
    if ($productId -gt 0) {
        & sqlcmd -S $SqlServer -d $Database -E -C -I -b -Q "DELETE FROM Products WHERE Id=$productId;" | Out-Null
    }
    & sqlcmd -S $SqlServer -d $Database -E -C -I -b -Q "DELETE FROM AspNetUsers WHERE Email='$adminEmail';" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Test cleanup failed.' }
}
