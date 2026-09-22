param([string]$BaseUrl = 'http://localhost:5006')

$ErrorActionPreference = 'Stop'
$failures = [Collections.Generic.List[string]]::new()
function Read-Body($response) {
    $body = if ($response.Content -is [byte[]]) { [Text.Encoding]::UTF8.GetString($response.Content) } else { $response.Content }
    return $body | ConvertFrom-Json
}

$baseline = Read-Body (Invoke-WebRequest "$BaseUrl/api/products?pageSize=100")
$all = if ($baseline.PSObject.Properties.Name -contains 'items') { @($baseline.items) } else { @($baseline) }
if ($all.Count -lt 3 -or $all.Count -ge 100) { throw 'Test prerequisite: 3-99 sample products.' }

function Check-Page([string]$label, [string]$query, [int]$page, [int]$pageSize, [array]$filtered) {
    $response = Invoke-WebRequest "$BaseUrl/api/products$query" -SkipHttpErrorCheck
    $body = Read-Body $response
    $expected = @($filtered | Select-Object -Skip (($page - 1) * $pageSize) -First $pageSize)
    $actualIds = ($body.items | ForEach-Object { $_.id }) -join ','
    $expectedIds = ($expected | ForEach-Object { $_.id }) -join ','
    if ($response.StatusCode -ne 200 -or $body.page -ne $page -or $body.pageSize -ne $pageSize -or
        $body.totalCount -ne $filtered.Count -or $actualIds -ne $expectedIds) {
        $failures.Add("${label}: wrong page metadata/items; expected IDs [$expectedIds], got [$actualIds]")
    } else { Write-Output "PASS: $label" }
}

Check-Page 'default first page' '' 1 20 $all
Check-Page 'first page' '?page=1&pageSize=2' 1 2 $all
Check-Page 'second page' '?page=2&pageSize=2' 2 2 $all
Check-Page 'page beyond results keeps count' '?page=1000000&pageSize=100' 1000000 100 $all
$brandId = $all[0].brandId
$filtered = @($all | Where-Object brandId -eq $brandId)
Check-Page 'count after filtering before paging' "?brandId=$brandId&page=2&pageSize=1" 2 1 $filtered
Check-Page 'zero matches' '?brandId=2147483647&page=1&pageSize=2' 1 2 @()

foreach ($case in @(
    @{ Query='?page=0'; Field='Page' },
    @{ Query='?page=-1'; Field='Page' },
    @{ Query='?page=1000001'; Field='Page' },
    @{ Query='?page=abc'; Field='Page' },
    @{ Query='?pageSize=0'; Field='PageSize' },
    @{ Query='?pageSize=101'; Field='PageSize' }
)) {
    $r = Invoke-WebRequest "$BaseUrl/api/products$($case.Query)" -SkipHttpErrorCheck
    if ($r.StatusCode -ne 400 -or !(Read-Body $r).errors.($case.Field)) { $failures.Add("Expected 400 for $($case.Query)") }
    else { Write-Output "PASS: $($case.Query)" }
}
if ($failures.Count) { throw ($failures -join "`n") }
Write-Output 'PASS: pagination tests.'
