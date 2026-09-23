param([string]$BaseUrl = 'http://localhost:5007')
$ErrorActionPreference = 'Stop'

function Expect-Spa([string]$path) {
    $response = Invoke-WebRequest "$BaseUrl$path" -SkipHttpErrorCheck
    if ($response.StatusCode -ne 200 -or $response.Headers['Content-Type'] -notlike 'text/html*' -or $response.Content -notmatch '<div id="root"></div>') {
        throw "${path}: expected the React index, got HTTP $($response.StatusCode) $($response.Headers['Content-Type'])"
    }
    Write-Output "PASS: React route $path returns index.html"
}

Expect-Spa '/'
Expect-Spa '/products/1'
Expect-Spa '/admin/orders/123'

$missingApi = Invoke-WebRequest "$BaseUrl/api/does-not-exist" -SkipHttpErrorCheck
if ($missingApi.StatusCode -ne 404 -or $missingApi.Headers['Content-Type'] -like 'text/html*') {
    throw 'Unknown API route must remain 404 and must not return the React index.'
}
Write-Output 'PASS: unknown API route remains 404'

$live = Invoke-WebRequest "$BaseUrl/health/live" -SkipHttpErrorCheck
if ($live.StatusCode -ne 200) { throw 'Published liveness endpoint failed.' }
Write-Output 'PASS: published health endpoint remains reachable'

$products = Invoke-WebRequest "$BaseUrl/api/products?page=1&pageSize=1" -SkipHttpErrorCheck
if ($products.StatusCode -ne 200 -or $products.Headers['Content-Type'] -notlike 'application/json*') {
    throw 'Published API route did not return JSON.'
}
Write-Output 'PASS: published API remains available under /api'
