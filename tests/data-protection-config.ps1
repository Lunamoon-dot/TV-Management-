param(
    [string]$ProjectPath = '.\nothing\nothing.csproj',
    [string]$PublishDirectory = '.\.codex-check\data-protection-publish'
)
$ErrorActionPreference = 'Stop'

dotnet publish $ProjectPath -c Release -o $PublishDirectory --no-restore
if ($LASTEXITCODE -ne 0) { throw 'Publish failed.' }

$dll = (Resolve-Path (Join-Path $PublishDirectory 'nothing.dll')).Path
$oldEnvironment = $env:ASPNETCORE_ENVIRONMENT
$oldUrls = $env:ASPNETCORE_URLS
$oldConnection = $env:ConnectionStrings__DefaultConnection
$oldKeysPath = $env:DataProtection__KeysPath

try {
    $env:ASPNETCORE_ENVIRONMENT = 'Production'
    $env:ASPNETCORE_URLS = 'http://localhost:5010'
    $env:ConnectionStrings__DefaultConnection = 'Server=.\MSSQLSERVER01;Database=NothingDb;Trusted_Connection=True;TrustServerCertificate=True;'
    Remove-Item Env:DataProtection__KeysPath -ErrorAction SilentlyContinue

    $missingConfigOutput = & dotnet $dll 2>&1
    if ($LASTEXITCODE -eq 0 -or ($missingConfigOutput -join "`n") -notmatch 'DataProtection:KeysPath') {
        throw 'Production did not fail fast when DataProtection:KeysPath was missing.'
    }
    Write-Output 'PASS: Production refuses to start without a durable key path'

    $keysPath = Join-Path (Resolve-Path $PublishDirectory) 'test-keys'
    $env:DataProtection__KeysPath = $keysPath
    $process = Start-Process dotnet -ArgumentList $dll -WorkingDirectory $PublishDirectory -WindowStyle Hidden -PassThru
    try {
        $started = $false
        for ($attempt = 0; $attempt -lt 30; $attempt++) {
            Start-Sleep -Milliseconds 250
            try {
                $response = Invoke-WebRequest 'http://localhost:5010/health/live' -TimeoutSec 1
                if ($response.StatusCode -eq 200) { $started = $true; break }
            } catch {}
        }
        if (-not $started) { throw 'Production app did not start with a configured key path.' }
        if (-not (Get-ChildItem $keysPath -Filter 'key-*.xml' -ErrorAction SilentlyContinue)) {
            throw 'No Data Protection key file was created.'
        }
        Write-Output 'PASS: Production starts and persists its Data Protection key'
    } finally {
        if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force }
    }
} finally {
    $env:ASPNETCORE_ENVIRONMENT = $oldEnvironment
    $env:ASPNETCORE_URLS = $oldUrls
    $env:ConnectionStrings__DefaultConnection = $oldConnection
    $env:DataProtection__KeysPath = $oldKeysPath
}
