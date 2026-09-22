param([string]$BaseUrl = 'http://localhost:5006')

$ErrorActionPreference = 'Stop'
$failures = [Collections.Generic.List[string]]::new()

function Read-Body($response) {
    $body = if ($response.Content -is [byte[]]) {
        [Text.Encoding]::UTF8.GetString($response.Content)
    } else { $response.Content }
    return $body | ConvertFrom-Json
}

function Check-Ids([string]$label, [string]$query, [array]$expected) {
    $response = Invoke-WebRequest "$BaseUrl/api/products$query&pageSize=100" -SkipHttpErrorCheck
    $body = Read-Body $response
    $actual = @($body.items)
    $actualIds = ($actual | ForEach-Object { $_.id }) -join ','
    $expectedIds = ($expected | ForEach-Object { $_.id }) -join ','
    if ($response.StatusCode -ne 200 -or $actualIds -ne $expectedIds -or $body.totalCount -ne $expected.Count) {
        $failures.Add("${label}: expected IDs [$expectedIds], got [$actualIds], HTTP $($response.StatusCode)")
    } else { Write-Output "PASS: $label" }
}

# Read-only integration checks against the lesson's populated local database.
$baseline = Read-Body (Invoke-WebRequest "$BaseUrl/api/products?pageSize=100")
$all = @($baseline.items)
if ($baseline.totalCount -gt 100) { throw 'Test prerequisite: at most 100 sample products.' }
$brandIds = @($all | Select-Object -ExpandProperty brandId -Unique)
if ($brandIds.Count -lt 2) { throw 'Test prerequisite: products from at least two brands.' }

$brandId = $brandIds[0]
Check-Ids 'brand filter' "?brandId=$brandId" @($all | Where-Object brandId -eq $brandId)

$search = $all[0].name
$encoded = [Uri]::EscapeDataString($search)
$matching = @($all | Where-Object { $_.name.Contains($search) })
Check-Ids 'name search' "?search=$encoded" $matching
Check-Ids 'trim search' "?search=%20$encoded%20" $matching
Check-Ids 'combined filters use AND' "?brandId=$($brandIds[1])&search=$encoded" @($matching | Where-Object brandId -eq $brandIds[1])
Check-Ids 'no matches' "?search=$([guid]::NewGuid().ToString('N'))" @()
Check-Ids 'unknown positive brand' '?brandId=2147483647' @()
Check-Ids 'blank search ignored' '?search=%20%20' $all
Check-Ids 'empty search ignored' '?search=' $all
Check-Ids 'empty brand optional' '?brandId=' $all

foreach ($case in @(
    @{ Query = '?brandId=0'; Field = 'BrandId' },
    @{ Query = '?brandId=-1'; Field = 'BrandId' },
    @{ Query = '?brandId=abc'; Field = 'BrandId' },
    @{ Query = '?search=' + ('x' * 201); Field = 'Search' }
)) {
    $response = Invoke-WebRequest "$BaseUrl/api/products$($case.Query)" -SkipHttpErrorCheck
    $body = Read-Body $response
    if ($response.StatusCode -ne 400 -or !$body.errors.($case.Field)) {
        $failures.Add("Expected 400 with $($case.Field) error for $($case.Query)")
    } else { Write-Output "PASS: validation $($case.Field)" }
}

$after = @((Read-Body (Invoke-WebRequest "$BaseUrl/api/products?pageSize=100")).items)
if (($all | ConvertTo-Json -Depth 5 -Compress) -ne ($after | ConvertTo-Json -Depth 5 -Compress)) {
    $failures.Add('Existing products changed during read-only tests.')
}
if ($failures.Count) { throw ($failures -join "`n") }
Write-Output 'PASS: all product filter tests; existing data unchanged.'
