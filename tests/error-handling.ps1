param([string]$BaseUrl = 'http://localhost:5006')

$ErrorActionPreference = 'Stop'
# Run against an isolated API instance configured with an unreachable SQL endpoint.
function Read-Body($response) {
    $body = if ($response.Content -is [byte[]]) { [Text.Encoding]::UTF8.GetString($response.Content) } else { $response.Content }
    return $body | ConvertFrom-Json
}

$traces = @()
foreach ($accept in @('application/json', 'text/html')) {
    $response = Invoke-WebRequest "$BaseUrl/api/products" -Headers @{ Accept = $accept } -SkipHttpErrorCheck
    $body = Read-Body $response
    if ($response.StatusCode -ne 500 -or $body.status -ne 500 -or
        $response.Headers['Content-Type'] -notlike 'application/problem+json*' -or
        $body.title -ne 'An unexpected error occurred.' -or
        $body.detail -ne 'Please try again later.' -or
        [string]::IsNullOrWhiteSpace($body.traceId)) { throw 'Unexpected error response.' }
    if ($response.Headers['X-Correlation-ID'] -ne $body.traceId) {
        throw 'ProblemDetails traceId does not match the response correlation ID.'
    }
    $unexpected = @($body.PSObject.Properties.Name | Where-Object { $_ -notin @('type', 'title', 'status', 'detail', 'traceId') })
    if ($unexpected.Count -gt 0) { throw 'Unexpected fields in public error response.' }
    $traces += $body.traceId
    Write-Output "PASS: sanitized 500 for Accept=$accept; traceId=$($body.traceId)"
}
if ($traces[0] -eq $traces[1]) { throw 'Requests must have distinct trace IDs.' }

$invalid = Invoke-WebRequest "$BaseUrl/api/products?page=0" -SkipHttpErrorCheck
if ($invalid.StatusCode -ne 400 -or -not (Read-Body $invalid).errors.Page) { throw 'Validation response changed.' }
Write-Output 'PASS: validation still returns 400 before accessing SQL'
$missing = Invoke-WebRequest "$BaseUrl/api/does-not-exist" -SkipHttpErrorCheck
if ($missing.StatusCode -ne 404) { throw 'Missing route must remain 404.' }
Write-Output 'PASS: missing route remains 404'
